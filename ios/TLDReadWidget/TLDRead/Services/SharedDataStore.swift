import Foundation
import WidgetKit

final class SharedDataStore {
    static let shared = SharedDataStore()

    private let defaults: UserDefaults?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private init() {
        defaults = AppGroupConstants.sharedDefaults
    }

    // MARK: - TLDRs

    func saveTLDRs(_ tldrs: [TLDRSummary]) {
        guard let data = try? encoder.encode(tldrs) else { return }
        defaults?.set(data, forKey: AppGroupConstants.Keys.cachedTLDRs)
        WidgetCenter.shared.reloadAllTimelines()
    }

    func loadTLDRs() -> [TLDRSummary] {
        guard let data = defaults?.data(forKey: AppGroupConstants.Keys.cachedTLDRs),
              let tldrs = try? decoder.decode([TLDRSummary].self, from: data) else {
            return []
        }
        return tldrs
    }

    func appendTLDRs(_ newTLDRs: [TLDRSummary]) {
        var existing = loadTLDRs()
        let existingIds = Set(existing.map(\.messageId))
        let unique = newTLDRs.filter { !existingIds.contains($0.messageId) }
        existing.insert(contentsOf: unique, at: 0)

        // Keep only last 50
        let trimmed = Array(existing.prefix(50))
        saveTLDRs(trimmed)
    }

    // MARK: - Tracked Senders

    func saveTrackedSenders(_ senders: [TrackedSender]) {
        guard let data = try? encoder.encode(senders) else { return }
        defaults?.set(data, forKey: AppGroupConstants.Keys.trackedSenders)
    }

    func loadTrackedSenders() -> [TrackedSender] {
        guard let data = defaults?.data(forKey: AppGroupConstants.Keys.trackedSenders),
              let senders = try? decoder.decode([TrackedSender].self, from: data) else {
            return []
        }
        return senders
    }

    // MARK: - Refresh

    func saveLastRefreshDate(_ date: Date) {
        defaults?.set(date.timeIntervalSince1970, forKey: AppGroupConstants.Keys.lastRefreshDate)
    }

    func loadLastRefreshDate() -> Date? {
        let interval = defaults?.double(forKey: AppGroupConstants.Keys.lastRefreshDate) ?? 0
        return interval > 0 ? Date(timeIntervalSince1970: interval) : nil
    }

    var refreshIntervalMinutes: Int {
        get {
            let value = defaults?.integer(forKey: AppGroupConstants.Keys.refreshIntervalMinutes) ?? 0
            return value > 0 ? value : 60
        }
        set {
            defaults?.set(newValue, forKey: AppGroupConstants.Keys.refreshIntervalMinutes)
        }
    }

    // MARK: - Clear

    func clearAll() {
        defaults?.removeObject(forKey: AppGroupConstants.Keys.cachedTLDRs)
        defaults?.removeObject(forKey: AppGroupConstants.Keys.lastRefreshDate)
        WidgetCenter.shared.reloadAllTimelines()
    }
}
