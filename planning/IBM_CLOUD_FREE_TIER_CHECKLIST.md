# IBM Cloud Catalog — Free/Lite Verification Checklist

**Verify live in your own account before creating resources.** Catalog offers, regions, quotas and terms can change. A `Lite` or `Free` label is not a guarantee that all associated usage or dependencies cost nothing.

## For every candidate service, record
- [ ] Exact service name and catalog URL
- [ ] Available plan (Lite/Free/paid)
- [ ] Region availability
- [ ] Included quota and overage behaviour
- [ ] Idle/sleep/delete/inactivity policy
- [ ] Required dependencies and their cost
- [ ] Storage, egress, request, build and runtime limits
- [ ] Data location, retention and security terms
- [ ] Export/backup options and lock-in risks
- [ ] Budget alerts and resource deletion process

## Candidates to investigate
| Need | Candidate | Notes to verify |
|---|---|---|
| Document database | IBM Cloudant | Confirm Lite availability, storage quota, request limits, region and backup/export options. |
| Authentication | IBM App ID or current supported identity option | Confirm plan, monthly event/user limits, sign-in options and account availability. |
| Container/API hosting | IBM Cloud Code Engine | Confirm included compute/request allowance, scaling behaviour, registry/build costs and overage charges. |
| Source control / CI/CD | IBM Continuous Delivery or other catalog tooling | Confirm current free/Lite eligibility, pipeline minutes, repository limits and inactivity rules. |
| Speech transcription | Watson Speech to Text or current alternative | Confirm plan availability, minute quota, privacy/data terms and overage pricing. |
| AI inference | Any eligible service in catalog | Confirm whether free tier exists, model access, quota, privacy terms and whether data is retained/used. |
| File/object storage | Current available catalog option | Confirm free allowance, egress, retention, access controls and encryption. |

## Cost-control actions
- Set a budget and billing alerts if available.
- Do not deploy public production endpoints until authentication and rate limits work.
- Set low maximum scaling/instance counts where supported.
- Use synthetic data and mock switch/payment integrations.
- Avoid uploading large medical images/audio until storage/egress costs are understood.
- Recheck pricing before each new service or region is added.
- Keep a resource inventory and delete unused instances.

## Service decision record
For each service chosen, document: reason, plan, region, limits, expected use, possible cost triggers, backup/export plan, privacy assessment and exit/migration path.
