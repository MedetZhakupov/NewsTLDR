import Foundation

final class ArticleExtractorService {

    struct ExtractedArticle {
        let url: URL
        let title: String?
        let textContent: String
    }

    // MARK: - Public API

    func extractArticles(from newsletter: Newsletter) async -> [ExtractedArticle] {
        let urls = extractArticleURLs(from: newsletter.bodyText, htmlBody: newsletter.htmlBody)

        var articles: [ExtractedArticle] = []
        for url in urls.prefix(3) {
            if let article = try? await fetchArticleContent(from: url) {
                articles.append(article)
            }
        }
        return articles
    }

    // MARK: - URL Extraction

    func extractArticleURLs(from bodyText: String, htmlBody: String?) -> [URL] {
        var urls: [URL] = []

        // Extract from plain text using NSDataDetector
        if let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) {
            let matches = detector.matches(in: bodyText, range: NSRange(bodyText.startIndex..., in: bodyText))
            for match in matches {
                if let url = match.url {
                    urls.append(url)
                }
            }
        }

        // Extract from HTML href attributes
        if let html = htmlBody {
            let hrefPattern = #"href=["']([^"']+)["']"#
            if let regex = try? NSRegularExpression(pattern: hrefPattern) {
                let matches = regex.matches(in: html, range: NSRange(html.startIndex..., in: html))
                for match in matches {
                    if let range = Range(match.range(at: 1), in: html),
                       let url = URL(string: String(html[range])) {
                        urls.append(url)
                    }
                }
            }
        }

        // Deduplicate by absolute string, preserving order
        var seen = Set<String>()
        let unique = urls.filter { url in
            let key = url.absoluteString
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }

        return unique.filter { isArticleURL($0) }
    }

    // MARK: - URL Filtering

    private static let blockedDomains: Set<String> = [
        "twitter.com", "x.com", "facebook.com", "instagram.com",
        "linkedin.com", "youtube.com", "tiktok.com",
        "mailto", "tel"
    ]

    private static let blockedPathPatterns: [String] = [
        "/unsubscribe", "/manage", "/preferences", "/track",
        "/click", "/open", "/pixel", "/beacon",
        "/share", "/forward", "/refer"
    ]

    private static let blockedExtensions: Set<String> = [
        "png", "jpg", "jpeg", "gif", "svg", "webp",
        "css", "js", "woff", "woff2", "ttf", "ico"
    ]

    private func isArticleURL(_ url: URL) -> Bool {
        guard let scheme = url.scheme, ["http", "https"].contains(scheme) else {
            return false
        }

        guard let host = url.host?.lowercased() else { return false }

        // Block social media and non-article domains
        for blocked in Self.blockedDomains {
            if host.contains(blocked) { return false }
        }

        let path = url.path.lowercased()

        // Block known non-article paths
        for pattern in Self.blockedPathPatterns {
            if path.contains(pattern) { return false }
        }

        // Block asset file extensions
        let ext = url.pathExtension.lowercased()
        if Self.blockedExtensions.contains(ext) { return false }

        // Require a meaningful path (not just the root)
        if path == "/" || path.isEmpty { return false }

        return true
    }

    // MARK: - Article Content Fetching

    func fetchArticleContent(from url: URL) async throws -> ExtractedArticle {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 15
        let session = URLSession(configuration: config)

        var request = URLRequest(url: url)
        request.setValue("TLDRead/1.0", forHTTPHeaderField: "User-Agent")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw ExtractionError.fetchFailed
        }

        guard let html = String(data: data, encoding: .utf8) else {
            throw ExtractionError.decodingFailed
        }

        let title = extractTitle(from: html)
        let content = extractReadableContent(from: html)

        guard !content.isEmpty else {
            throw ExtractionError.noContent
        }

        let truncated = String(content.prefix(6000))
        return ExtractedArticle(url: url, title: title, textContent: truncated)
    }

    // MARK: - HTML Content Extraction

    private func extractTitle(from html: String) -> String? {
        let pattern = #"<title[^>]*>(.*?)</title>"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive, .dotMatchesLineSeparators]),
              let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
              let range = Range(match.range(at: 1), in: html) else {
            return nil
        }
        return String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func extractReadableContent(from html: String) -> String {
        var cleaned = html

        // Remove script, style, nav, header, footer, aside tags and their content
        let tagsToRemove = ["script", "style", "nav", "header", "footer", "aside", "noscript"]
        for tag in tagsToRemove {
            let pattern = "<\(tag)[^>]*>[\\s\\S]*?</\(tag)>"
            cleaned = cleaned.replacingOccurrences(of: pattern, with: "", options: [.regularExpression, .caseInsensitive])
        }

        // Try to extract content from <article> or <main> tags first
        if let articleContent = extractTagContent(from: cleaned, tag: "article") {
            return stripAllHTML(articleContent)
        }

        if let mainContent = extractTagContent(from: cleaned, tag: "main") {
            return stripAllHTML(mainContent)
        }

        // Fallback: strip all HTML from the cleaned document
        return stripAllHTML(cleaned)
    }

    private func extractTagContent(from html: String, tag: String) -> String? {
        let pattern = "<\(tag)[^>]*>([\\s\\S]*?)</\(tag)>"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
              let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
              let range = Range(match.range(at: 1), in: html) else {
            return nil
        }
        let content = String(html[range])
        return content.isEmpty ? nil : content
    }

    private func stripAllHTML(_ html: String) -> String {
        // Use NSAttributedString for best results
        if let data = html.data(using: .utf8),
           let attributed = try? NSAttributedString(
               data: data,
               options: [
                   .documentType: NSAttributedString.DocumentType.html,
                   .characterEncoding: String.Encoding.utf8.rawValue,
               ],
               documentAttributes: nil
           ) {
            return collapseWhitespace(attributed.string)
        }

        // Fallback: regex strip
        let stripped = html.replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        return collapseWhitespace(stripped)
    }

    private func collapseWhitespace(_ text: String) -> String {
        text.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }

    // MARK: - Errors

    enum ExtractionError: Error {
        case fetchFailed
        case decodingFailed
        case noContent
    }
}
