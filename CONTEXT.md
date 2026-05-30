# Node Fetch

This context manages user-owned subscription sources and the rules used to fetch, cache, merge, and deliver generated subscription configurations.

## Language

**Proxy Provider**:
The named relay service used to fetch a subscription source indirectly instead of requesting the source URL directly.
_Avoid_: Proxy switch, useProxy, proxy flag

**Subscription Source**:
A user-configured remote subscription URL that can be fetched directly or through a selected Proxy Provider.
_Avoid_: Link, node list, feed
