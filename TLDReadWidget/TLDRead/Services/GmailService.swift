import Foundation

final class GmailService {
    private let baseURL = "https://gmail.googleapis.com/gmail/v1/users/me"
    private let authService: GoogleAuthService

    init(authService: GoogleAuthService = .shared) {
        self.authService = authService
    }

    // MARK: - Discover Senders

    func fetchRecentSenders(maxResults: Int = 200) async throws -> [TrackedSender] {
        try await authService.refreshTokenIfNeeded()

        guard let token = authService.accessToken else {
            throw GmailError.notAuthenticated
        }

        let query = "category:promotions OR label:newsletters"
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let url = URL(string: "\(baseURL)/messages?q=\(encodedQuery)&maxResults=\(maxResults)")!

        let messageList: MessageListResponse = try await fetchJSON(url: url, token: token)

        guard let messages = messageList.messages else {
            return []
        }

        var senderMap: [String: (name: String, email: String, count: Int)] = [:]

        // Fetch headers for each message to extract senders
        // Process in batches to avoid rate limits
        let batchSize = 20
        for batch in stride(from: 0, to: min(messages.count, maxResults), by: batchSize) {
            let end = min(batch + batchSize, messages.count)
            let batchMessages = messages[batch..<end]

            await withTaskGroup(of: (String, String)?.self) { group in
                for message in batchMessages {
                    group.addTask {
                        try? await self.fetchSenderInfo(messageId: message.id, token: token)
                    }
                }

                for await result in group {
                    if let (name, email) = result {
                        let key = email.lowercased()
                        if let existing = senderMap[key] {
                            senderMap[key] = (name: existing.name, email: existing.email, count: existing.count + 1)
                        } else {
                            senderMap[key] = (name: name, email: email, count: 1)
                        }
                    }
                }
            }
        }

        return senderMap.values
            .sorted { $0.count > $1.count }
            .map { TrackedSender(name: $0.name, email: $0.email) }
    }

    // MARK: - Fetch Newsletters

    func fetchNewsletters(from senders: [TrackedSender], since: Date) async throws -> [Newsletter] {
        try await authService.refreshTokenIfNeeded()

        guard let token = authService.accessToken else {
            throw GmailError.notAuthenticated
        }

        let timestamp = Int(since.timeIntervalSince1970)
        var newsletters: [Newsletter] = []

        for sender in senders where sender.isTracked {
            let query = "from:\(sender.email) after:\(timestamp)"
            let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
            let url = URL(string: "\(baseURL)/messages?q=\(encodedQuery)&maxResults=10")!

            let messageList: MessageListResponse = try await fetchJSON(url: url, token: token)

            guard let messages = messageList.messages else { continue }

            for messageRef in messages.prefix(5) {
                if let newsletter = try? await fetchFullMessage(messageId: messageRef.id, sender: sender, token: token) {
                    newsletters.append(newsletter)
                }
            }
        }

        return newsletters.sorted { $0.receivedDate > $1.receivedDate }
    }

    // MARK: - Private Helpers

    private func fetchSenderInfo(messageId: String, token: String) async throws -> (String, String) {
        let url = URL(string: "\(baseURL)/messages/\(messageId)?format=metadata&metadataHeaders=From")!
        let message: MessageResponse = try await fetchJSON(url: url, token: token)

        guard let fromHeader = message.payload?.headers?.first(where: { $0.name == "From" })?.value else {
            throw GmailError.parseError
        }

        return parseSender(from: fromHeader)
    }

    private func fetchFullMessage(messageId: String, sender: TrackedSender, token: String) async throws -> Newsletter {
        let url = URL(string: "\(baseURL)/messages/\(messageId)?format=full")!
        let message: MessageResponse = try await fetchJSON(url: url, token: token)

        let subject = message.payload?.headers?.first(where: { $0.name == "Subject" })?.value ?? "No Subject"
        let bodyText = extractBody(from: message.payload)
        let truncatedBody = String(bodyText.prefix(4000))

        let internalDate = Double(message.internalDate ?? "0") ?? 0
        let receivedDate = Date(timeIntervalSince1970: internalDate / 1000)

        return Newsletter(
            id: UUID().uuidString,
            messageId: messageId,
            senderName: sender.name,
            senderEmail: sender.email,
            subject: subject,
            bodyText: truncatedBody,
            receivedDate: receivedDate
        )
    }

    private func extractBody(from payload: MessagePayload?) -> String {
        guard let payload else { return "" }

        // Try text/plain first
        if payload.mimeType == "text/plain", let data = payload.body?.data {
            return decodeBase64URL(data)
        }

        // Check parts for text/plain then text/html
        if let parts = payload.parts {
            // Prefer text/plain
            if let plainPart = parts.first(where: { $0.mimeType == "text/plain" }),
               let data = plainPart.body?.data {
                return decodeBase64URL(data)
            }

            // Fall back to text/html with tag stripping
            if let htmlPart = parts.first(where: { $0.mimeType == "text/html" }),
               let data = htmlPart.body?.data {
                let html = decodeBase64URL(data)
                return stripHTML(html)
            }

            // Recurse into multipart
            for part in parts {
                let result = extractBody(from: part)
                if !result.isEmpty { return result }
            }
        }

        return ""
    }

    private func decodeBase64URL(_ string: String) -> String {
        var base64 = string
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }

        guard let data = Data(base64Encoded: base64),
              let text = String(data: data, encoding: .utf8) else {
            return ""
        }
        return text
    }

    private func stripHTML(_ html: String) -> String {
        guard let data = html.data(using: .utf8),
              let attributedString = try? NSAttributedString(
                  data: data,
                  options: [
                      .documentType: NSAttributedString.DocumentType.html,
                      .characterEncoding: String.Encoding.utf8.rawValue,
                  ],
                  documentAttributes: nil
              ) else {
            // Fallback: simple regex strip
            return html.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        }
        return attributedString.string
    }

    private func parseSender(from headerValue: String) -> (String, String) {
        let pattern = #"^(.+?)\s*<(.+?)>$"#
        if let match = headerValue.range(of: pattern, options: .regularExpression) {
            let parts = headerValue[match]
            if let angleBracketStart = parts.firstIndex(of: "<"),
               let angleBracketEnd = parts.firstIndex(of: ">") {
                let name = String(parts[parts.startIndex..<angleBracketStart]).trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "\""))
                let email = String(parts[parts.index(after: angleBracketStart)..<angleBracketEnd])
                return (name, email)
            }
        }
        return (headerValue, headerValue)
    }

    private func fetchJSON<T: Decodable>(url: URL, token: String) async throws -> T {
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw GmailError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw GmailError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Error

    enum GmailError: LocalizedError {
        case notAuthenticated
        case parseError
        case invalidResponse
        case httpError(statusCode: Int)

        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "Not authenticated with Gmail."
            case .parseError: return "Failed to parse email data."
            case .invalidResponse: return "Invalid response from Gmail API."
            case .httpError(let code): return "Gmail API error (HTTP \(code))."
            }
        }
    }
}

// MARK: - Gmail API Response Models

private struct MessageListResponse: Decodable {
    let messages: [MessageRef]?
    let nextPageToken: String?
    let resultSizeEstimate: Int?
}

private struct MessageRef: Decodable {
    let id: String
    let threadId: String
}

struct MessageResponse: Decodable {
    let id: String
    let threadId: String
    let internalDate: String?
    let payload: MessagePayload?
}

struct MessagePayload: Decodable {
    let mimeType: String?
    let headers: [MessageHeader]?
    let body: MessageBody?
    let parts: [MessagePayload]?
}

struct MessageHeader: Decodable {
    let name: String
    let value: String
}

struct MessageBody: Decodable {
    let size: Int?
    let data: String?
}
