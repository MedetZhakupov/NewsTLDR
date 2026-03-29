import SwiftUI

struct NewsletterListView: View {
    @Bindable var viewModel: NewsletterViewModel

    var body: some View {
        List {
            if let progress = viewModel.progress {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text(progress)
                            .foregroundStyle(.secondary)
                            .font(.subheadline)
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.orange)
                        .font(.caption)
                }
            }

            if viewModel.tldrs.isEmpty && !viewModel.isLoading {
                Section {
                    ContentUnavailableView(
                        "No Summaries Yet",
                        systemImage: "doc.text.magnifyingglass",
                        description: Text("Pull to refresh or tap the refresh button to fetch and summarize your newsletters.")
                    )
                }
            }

            Section {
                ForEach(viewModel.tldrs) { tldr in
                    NavigationLink(value: tldr) {
                        TLDRRowView(tldr: tldr)
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        viewModel.deleteTLDR(viewModel.tldrs[index])
                    }
                }
            }
        }
        .navigationTitle("TLDRead")
        .navigationDestination(for: TLDRSummary.self) { tldr in
            NewsletterDetailView(tldr: tldr)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.refreshTLDRs() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .refreshable {
            await viewModel.refreshTLDRs()
        }
        .onAppear {
            viewModel.loadCachedTLDRs()
        }
    }
}

private struct TLDRRowView: View {
    let tldr: TLDRSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(tldr.senderName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.blue)

                Spacer()

                Text(tldr.receivedDate, style: .relative)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Text(tldr.subject)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)

            Text(tldr.tldr)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(3)
        }
        .padding(.vertical, 4)
    }
}
