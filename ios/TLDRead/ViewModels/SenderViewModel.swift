import Foundation

@Observable
@MainActor
final class SenderViewModel {
    private let gmailService = GmailService()
    private let store = SharedDataStore.shared

    var discoveredSenders: [TrackedSender] = []
    var isLoading = false
    var errorMessage: String?
    var searchText = ""

    var filteredSenders: [TrackedSender] {
        if searchText.isEmpty {
            return discoveredSenders
        }
        return discoveredSenders.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.email.localizedCaseInsensitiveContains(searchText)
        }
    }

    var trackedSenders: [TrackedSender] {
        discoveredSenders.filter(\.isTracked)
    }

    func loadSenders() async {
        // Load previously tracked senders
        let tracked = store.loadTrackedSenders()
        let trackedEmails = Set(tracked.map(\.email))

        isLoading = true
        errorMessage = nil

        do {
            let fetched = try await gmailService.fetchRecentSenders()

            // Merge: preserve tracked state for known senders
            discoveredSenders = fetched.map { sender in
                if trackedEmails.contains(sender.email) {
                    return TrackedSender(name: sender.name, email: sender.email, isTracked: true)
                }
                return sender
            }

            // Add tracked senders that weren't in recent fetch
            for tracked in tracked {
                if !discoveredSenders.contains(where: { $0.email == tracked.email }) {
                    discoveredSenders.append(tracked)
                }
            }
        } catch {
            errorMessage = error.localizedDescription
            // Fall back to previously tracked senders
            if discoveredSenders.isEmpty {
                discoveredSenders = tracked
            }
        }

        isLoading = false
    }

    func toggleSender(_ sender: TrackedSender) {
        guard let index = discoveredSenders.firstIndex(where: { $0.id == sender.id }) else { return }
        discoveredSenders[index].isTracked.toggle()
        persistTrackedSenders()
    }

    private func persistTrackedSenders() {
        store.saveTrackedSenders(discoveredSenders.filter(\.isTracked))
    }
}
