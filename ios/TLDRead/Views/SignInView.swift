import SwiftUI

struct SignInView: View {
    @Bindable var viewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "envelope.badge.shield.half.filled")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue)

                Text("TLDRead")
                    .font(.largeTitle.bold())

                Text("Get TLDR summaries of your\nGmail newsletters, powered by AI")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            VStack(spacing: 16) {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task { await viewModel.signIn() }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "envelope.fill")
                        Text("Sign in with Google")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(viewModel.isLoading)

                if viewModel.isLoading {
                    ProgressView()
                }

                Text("We only request read-only access to your Gmail.\nYour emails are processed on-device.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
            }

            Spacer()
        }
        .padding(24)
    }
}
