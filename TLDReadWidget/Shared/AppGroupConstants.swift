import Foundation

enum AppGroupConstants {
    static let suiteName = "group.com.medetzhakupov.TLDRead"

    enum Keys {
        static let cachedTLDRs = "cached_tldrs"
        static let trackedSenders = "tracked_senders"
        static let lastRefreshDate = "last_refresh_date"
        static let refreshIntervalMinutes = "refresh_interval_minutes"
    }

    static var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: suiteName)
    }
}
