import WidgetKit

struct TLDREntry: TimelineEntry {
    let date: Date
    let tldrs: [TLDRSummary]

    static var placeholder: TLDREntry {
        TLDREntry(
            date: Date(),
            tldrs: [
                TLDRSummary(
                    id: "preview-1",
                    messageId: "msg-1",
                    senderName: "The Morning Brew",
                    senderEmail: "brew@morningbrew.com",
                    subject: "Markets Rally on Fed Decision",
                    tldr: "The Fed held rates steady as expected. Markets responded positively with the S&P 500 gaining 1.2%. Tech stocks led the rally.",
                    receivedDate: Date(),
                    summarizedDate: Date()
                ),
                TLDRSummary(
                    id: "preview-2",
                    messageId: "msg-2",
                    senderName: "iOS Dev Weekly",
                    senderEmail: "dave@iosdevweekly.com",
                    subject: "Swift 6 Migration Guide",
                    tldr: "Apple released the official Swift 6 migration guide. Key changes include strict concurrency by default and new ownership features.",
                    receivedDate: Date().addingTimeInterval(-3600),
                    summarizedDate: Date()
                ),
                TLDRSummary(
                    id: "preview-3",
                    messageId: "msg-3",
                    senderName: "TLDR Newsletter",
                    senderEmail: "dan@tldrnewsletter.com",
                    subject: "AI Agents Are Getting Real",
                    tldr: "Major tech companies are shipping AI agent frameworks. Claude, GPT, and Gemini all now support tool use and multi-step reasoning.",
                    receivedDate: Date().addingTimeInterval(-7200),
                    summarizedDate: Date()
                ),
            ]
        )
    }

    static var empty: TLDREntry {
        TLDREntry(date: Date(), tldrs: [])
    }
}
