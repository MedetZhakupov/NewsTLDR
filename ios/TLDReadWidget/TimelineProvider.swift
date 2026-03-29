import WidgetKit

struct TLDRTimelineProvider: TimelineProvider {
    private let store = SharedDataStore.shared

    func placeholder(in context: Context) -> TLDREntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (TLDREntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
        } else {
            let tldrs = store.loadTLDRs()
            completion(TLDREntry(date: Date(), tldrs: tldrs))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TLDREntry>) -> Void) {
        let tldrs = store.loadTLDRs()
        let entry = TLDREntry(date: Date(), tldrs: tldrs)

        let refreshMinutes = store.refreshIntervalMinutes
        let nextRefresh = Date().addingTimeInterval(Double(refreshMinutes * 60))

        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }
}
