# Apps, downloads and offline communication

Reviewed 6 October 2026.

## Captive changes

Removed the `Use Mesh without internet` link from the local welcome and cloud catalogue: it navigated elsewhere rather than closing the captive window. The local Mesh logo now scrolls to its welcome heading; the cloud logo keeps the current internet catalogue instead of opening the older Explore screen. This corrects navigation, not proof that it caused all handoff latency.

Official Blink/Signal SVGs are served locally on the welcome and persistent Mesh page. The cloud app card uses the official Blink icon. See `public/images/apps/SOURCES.md` for provenance. These marks identify independent apps, not an endorsement or an Afribit-operated wallet/messenger.

iPhone's native **Without Internet** option keeps Wi-Fi associated and dismisses the welcome. A website redirect is not that OS action. Do not fake working unrestricted internet to dismiss the window. [Apple captive guidance](https://support.apple.com/en-gb/102554).

## Communication without WAN

Signal messaging and Blink wallet refresh have operator acceptance on unpaid Mesh with cellular data off. Both still need Mesh's WAN and external services. Downloads, account setup, every wallet operation and Signal calls are separate acceptance cases.

Jami is the already-tested Android/iPhone LAN option: foreground texts and calls worked with WAN disconnected. Locked-screen delivery failed on both tested phones. Its usual DHT proxy wakes apps through Apple/Google push; a proxy alone does not guarantee offline iPhone wake-up. [Jami mobile design](https://www.jami.net/jami-and-proxys/), [official LAN guidance](https://forum.jami.net/t/jami-survival-kit-internet-down-keep-talking/5351).

Briar is an Android candidate for Wi-Fi/Bluetooth texting, with direct APK/F-Droid distribution and offline sharing. It does not supply the iPhone solution. [Downloads](https://briarproject.org/download-briar/), [manual](https://briarproject.org/manual/).

Berty advertises open-source Android/iOS offline communication using proximity transports. Treat it as a small separate trial: routed subnet discovery, cross-platform behavior and locked-screen alerts are unproven here. Its public features page contains older release wording; platform claims alone do not establish maturity. [Features](https://berty.tech/features), [FAQ](https://berty.tech/faq/).

Recommendation: keep Jami for the proven foreground LAN use; trial Briar with two Android devices if that audience fits. Reliable WAN-off iPhone alerts need the prerequisites in [background delivery options](mesh-background-delivery-options.md), not a promise that switching apps bypasses OS suspension.

## Restrict Google Play to three apps?

Not reliably using our domain/IP allowlists on unmanaged visitor phones. Downloads, store APIs, accounts and assets use many shared HTTPS destinations. The router cannot inspect an encrypted URL/package identifier to permit only Blink, Signal and Jami. This is a technical inference from the documented network requirements; a specific store link is not enforcement. [Google network requirements](https://support.google.com/work/android/answer/10513641?hl=en).

Managed Google Play approves packages on enrolled, managed devices. Joining Mesh does not enroll a customer's phone. [Google distribution policy](https://developers.google.com/android/management/apps).

We have not opened broad Google Play/CDN ranges. Options:

1. Install from the store beforehand, or use a normal pass for downloads.
2. Consider an operator-issued installation allowance with time/data bounds. Other traffic is possible during it; it cannot guarantee three-app-only access.
3. Serve verified, unchanged Android APKs from publisher-approved sources on a local server, with release/signature verification and update handling. Signal publishes an APK and signing-certificate instructions; Jami links F-Droid. Verify Blink's official APK distribution before offering it. Keep large APKs off the router's small flash. [Signal APK](https://signal.org/android/apk/), [Jami downloads](https://jami.net/download-jami-android/).

For iPhone, use normal internet for App Store installation. Local iOS distribution and reliable offline background delivery are not commissioned.
