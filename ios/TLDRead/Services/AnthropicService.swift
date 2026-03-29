import Foundation

final class AnthropicService {
    private let baseURL = "https://api.anthropic.com/v1/messages"
    private let model = "claude-sonnet-4-20250514"
    private let apiVersion = "2023-06-01"

    private let systemPrompt = """
        You are a newsletter summarizer. Generate a concise TLDR (2-3 sentences) \
        of the following newsletter email. Focus on the key takeaways and most \
        important information. Be direct and informative.
        """

    var apiKey: String? {
        KeychainHelper.readString(.anthropicAPIKey)
    }

    var hasAPIKey: Bool {
        apiKey != nil
    }

    func generateTLDR(for newsletter: Newsletter) async throws -> TLDRSummary {
        guard let apiKey else {
            throw AnthropicError.noAPIKey
        }

        let requestBody = AnthropicRequest(
            model: model,
            max_tokens: 256,
            system: systemPrompt,
            messages: [
                .init(role: "user", content: """
                    Newsletter from: \(newsletter.senderName) <\(newsletter.senderEmail)>
                    Subject: \(newsletter.subject)

                    \(newsletter.bodyText)
                    """)
            ]
        )

        var request = URLRequest(url: URL(string: baseURL)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(apiVersion, forHTTPHeaderField: "anthropic-version")
        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AnthropicError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if let errorResponse = try? JSONDecoder().decode(AnthropicErrorResponse.self, from: data) {
                throw AnthropicError.apiError(message: errorResponse.error.message)
            }
            throw AnthropicError.httpError(statusCode: httpResponse.statusCode)
        }

        let apiResponse = try JSONDecoder().decode(AnthropicResponse.self, from: data)

        guard let tldrText = apiResponse.content.first?.text else {
            throw AnthropicError.emptyResponse
        }

        return TLDRSummary(
            id: UUID().uuidString,
            messageId: newsletter.messageId,
            senderName: newsletter.senderName,
            senderEmail: newsletter.senderEmail,
            subject: newsletter.subject,
            tldr: tldrText,
            receivedDate: newsletter.receivedDate,
            summarizedDate: Date()
        )
    }

    func generateTLDRs(for newsletters: [Newsletter]) async throws -> [TLDRSummary] {
        var summaries: [TLDRSummary] = []

        for newsletter in newsletters {
            let summary = try await generateTLDR(for: newsletter)
            summaries.append(summary)

            // Rate limit: ~1 request per second
            if newsletter.id != newsletters.last?.id {
                try await Task.sleep(nanoseconds: 1_000_000_000)
            }
        }

        return summaries
    }

    // MARK: - Errors

    enum AnthropicError: LocalizedError {
        case noAPIKey
        case invalidResponse
        case httpError(statusCode: Int)
        case apiError(message: String)
        case emptyResponse

        var errorDescription: String? {
            switch self {
            case .noAPIKey:
                return "Anthropic API key not configured. Add it in Settings."
            case .invalidResponse:
                return "Invalid response from Anthropic API."
            case .httpError(let code):
                return "Anthropic API error (HTTP \(code))."
            case .apiError(let message):
                return "Anthropic API: \(message)"
            case .emptyResponse:
                return "Anthropic API returned an empty response."
            }
        }
    }
}

// MARK: - Request/Response Models

private struct AnthropicRequest: Encodable {
    let model: String
    let max_tokens: Int
    let system: String
    let messages: [Message]

    struct Message: Encodable {
        let role: String
        let content: String
    }
}

private struct AnthropicResponse: Decodable {
    let id: String
    let content: [ContentBlock]

    struct ContentBlock: Decodable {
        let type: String
        let text: String?
    }
}

private struct AnthropicErrorResponse: Decodable {
    let error: ErrorDetail

    struct ErrorDetail: Decodable {
        let type: String
        let message: String
    }
}
