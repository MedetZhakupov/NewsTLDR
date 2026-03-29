import SwiftUI

struct NewsletterDetailView: View {
    let tldr: TLDRSummary
    @State private var showCopied = false

    private var shareText: String {
        "\(tldr.subject)\n\n\(tldr.tldr)"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(tldr.subject)
                        .font(.title2.bold())

                    HStack {
                        Label(tldr.senderName, systemImage: "person.circle")
                            .font(.subheadline)
                            .foregroundStyle(.blue)

                        Spacer()

                        Text(tldr.receivedDate, style: .date)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Text(tldr.senderEmail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                // TLDR
                VStack(alignment: .leading, spacing: 8) {
                    Label("TLDR", systemImage: "sparkles")
                        .font(.headline)

                    Text(tldr.tldr)
                        .font(.body)
                        .lineSpacing(4)
                }
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Meta
                VStack(alignment: .leading, spacing: 4) {
                    Label("Summarized \(tldr.summarizedDate, style: .relative) ago", systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: shareText) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    UIPasteboard.general.string = shareText
                    showCopied = true
                } label: {
                    Image(systemName: showCopied ? "checkmark" : "doc.on.doc")
                }
            }
        }
        .onChange(of: showCopied) { _, newValue in
            if newValue {
                Task {
                    try? await Task.sleep(nanoseconds: 1_500_000_000)
                    showCopied = false
                }
            }
        }
    }
}
