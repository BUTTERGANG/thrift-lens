---
status: backlog
priority: P2
agent_claimed: null
claimed_at: null
updated: 2026-08-20
---

# Photo Capture and Item Identification

> **Repo:** thrift-lens
> **Description:** Camera integration with ML-based item identification from photos

---

## Context

User snaps a photo of a thrift find and gets instant identification for pricing research.

---

## Acceptance Criteria

- [ ] Camera integration with auto-capture optimization (focus, lighting guide)
- [ ] Image classification using CLIP or similar vision model
- [ ] Brand and model recognition from labels/logos in photo
- [ ] Multiple photo capture for items with parts/accessories

---

## Technical Notes

- MediaPipe for on-device classification; CLIP embeddings for similarity search; canvas for image preprocessing
