import Foundation

struct TLDRSummary: Codable, Identifiable, Hashable {
    let id: String
    let messageId: String
    let senderName: String
    let senderEmail: String
    let subject: String
    let tldr: String
    let receivedDate: Date
    let summarizedDate: Date

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: TLDRSummary, rhs: TLDRSummary) -> Bool {
        lhs.id == rhs.id
    }
}

struct TrackedSender: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let email: String
    var isTracked: Bool

    init(name: String, email: String, isTracked: Bool = false) {
        self.id = email
        self.name = name
        self.email = email
        self.isTracked = isTracked
    }
}

struct Newsletter: Codable, Identifiable {
    let id: String
    let messageId: String
    let senderName: String
    let senderEmail: String
    let subject: String
    let bodyText: String
    let receivedDate: Date
}
