---
status: backlog
priority: P2
agent_claimed: null
claimed_at: null
updated: 2026-08-20
---

# Live eBay Comps Search

> **Repo:** thrift-lens
> **Description:** Search active eBay listings for same item and extract pricing data

---

## Context

After identifying an item, search eBay's active listings for comparable items to determine market value.

---

## Acceptance Criteria

- [ ] eBay Browse API integration with OAuth token management
- [ ] Query construction from item category + brand + model
- [ ] Price extraction: min, max, median, and average for comparable condition
- [ ] Sold listings vs active listings toggle for true market value

---

## Technical Notes

- eBay API v2; condition-based filtering (New/Used/For Parts); cache results with 1hr TTL
