# ADR-003: Choose Firebase Cloud Messaging (FCM) - Push Notification Service

**Status:** Accepted

**Context:** The system requires a reliable and scalable push notification service to send real-time notifications to users about recipe status updates, admin actions, comments, ratings, and community engagement. The solution should support cross-platform delivery (web, iOS, Android), provide high delivery rates, and offer easy integration with the backend while maintaining good performance and cost-effectiveness.

**Decision:** We chose Firebase Cloud Messaging (FCM) as the push notification delivery service for real-time notifications such as recipe approval/rejection notifications, comment replies, rating updates, and admin announcements.

**Consequences:**

1. **Cross-Platform Support:** Single API to send notifications to web, iOS, and Android platforms, reducing implementation complexity.

2. **High Reliability:** Google's infrastructure ensures high delivery rates and message persistence for offline devices.

3. **Cost-Effective:** Free tier with generous quotas suitable for the application's scale.

4. **Real-Time Delivery:** Instant notification delivery with low latency for time-sensitive updates.

5. **Topic-Based Messaging:** Support for topic subscriptions enabling efficient broadcasting to user segments.

6. **Device Management:** Built-in token management and automatic token refresh handling.

**Decision Date:** 30 October 2025

**Author:** Easy Going
