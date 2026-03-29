// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TLDRead",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/google/GoogleSignIn-iOS.git", from: "8.0.0"),
    ],
    targets: [
        .target(name: "TLDRead"),
    ]
)
