import Foundation

@Observable
@MainActor
final class NewsletterViewModel {
    private let gmailService = GmailService()
    private let anthropicService = AnthropicService()
    private let articleExtractor = ArticleExtractorService()
    private let store = SharedDataStore.shared

    var tldrs: [TLDRSummary] = []
    var hasLoaded = false
    var isLoading = false
    var isGenerating = false
    var errorMessage: String?
    var progress: String?

    var hasAPIKey: Bool { anthropicService.hasAPIKey }
    var lastRefreshDate: Date? { store.loadLastRefreshDate() }

    func loadCachedTLDRs() {
        tldrs = store.loadTLDRs()
        hasLoaded = true
    }

    func refreshTLDRs() async {
        let trackedSenders = store.loadTrackedSenders()

        guard !trackedSenders.isEmpty else {
            errorMessage = "No newsletter senders selected. Go to Senders to pick some."
            return
        }

        guard anthropicService.hasAPIKey else {
            errorMessage = "Anthropic API key not set. Add it in Settings."
            return
        }

        isLoading = true
        isGenerating = false
        errorMessage = nil
        progress = "Fetching newsletters from Gmail..."

        do {
            // Fetch newsletters from last 24 hours
            let since = Date().addingTimeInterval(-86400)
            let newsletters = try await gmailService.fetchNewsletters(from: trackedSenders, since: since)

            // Filter out already summarized
            let existingIds = Set(tldrs.map(\.messageId))
            let newNewsletters = newsletters.filter { !existingIds.contains($0.messageId) }

            guard !newNewsletters.isEmpty else {
                progress = nil
                isLoading = false
                return
            }

            // Generate TLDRs
            isGenerating = true
            var newSummaries: [TLDRSummary] = []

            for (index, newsletter) in newNewsletters.enumerated() {
                progress = "Extracting articles \(index + 1) of \(newNewsletters.count)..."

                let articles = await articleExtractor.extractArticles(from: newsletter)
                let combinedText = articles.map(\.textContent).joined(separator: "\n---\n")
                let articleContent = combinedText.isEmpty ? nil : String(combinedText.prefix(10000))

                progress = "Summarizing \(index + 1) of \(newNewsletters.count)..."

                let summary = try await anthropicService.generateTLDR(for: newsletter, articleContent: articleContent)
                newSummaries.append(summary)

                // Rate limit
                if index < newNewsletters.count - 1 {
                    try await Task.sleep(nanoseconds: 1_000_000_000)
                }
            }

            // Save and update
            store.appendTLDRs(newSummaries)
            store.saveLastRefreshDate(Date())
            tldrs = store.loadTLDRs()

        } catch {
            errorMessage = error.localizedDescription
        }

        progress = nil
        isLoading = false
        isGenerating = false
    }

    func deleteTLDR(_ tldr: TLDRSummary) {
        tldrs.removeAll { $0.id == tldr.id }
        store.saveTLDRs(tldrs)
    }

    func clearAll() {
        tldrs = []
        store.clearAll()
    }
}
