import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let entry: TLDREntry

    var body: some View {
        if entry.tldrs.isEmpty {
            emptyState
        } else {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundStyle(.blue)
                    Text("TLDRead")
                        .font(.caption)
                        .fontWeight(.bold)
                    Spacer()
                    Text("Updated \(entry.date, style: .relative) ago")
                        .font(.system(size: 9))
                        .foregroundStyle(.tertiary)
                }
                .padding(.bottom, 2)

                ForEach(entry.tldrs.prefix(5)) { tldr in
                    Link(destination: URL(string: "tldread://tldr/\(tldr.messageId)")!) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text(tldr.senderName)
                                    .font(.caption2)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.blue)

                                Spacer()

                                Text(tldr.receivedDate, style: .relative)
                                    .font(.system(size: 9))
                                    .foregroundStyle(.tertiary)
                            }

                            Text(tldr.subject)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)

                            Text(tldr.tldr)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                    }

                    if tldr.id != entry.tldrs.prefix(5).last?.id {
                        Divider()
                    }
                }

                Spacer(minLength: 0)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("No Newsletter Summaries")
                .font(.subheadline)
                .fontWeight(.medium)
            Text("Open TLDRead, sign in with Google,\nand select newsletters to track.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
