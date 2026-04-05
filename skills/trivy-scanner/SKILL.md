---
name: trivy-scanner
description: Scan the current project for vulnerabilities using Trivy via Podman
---

## Usage

When the user asks to scan for vulnerabilities, security scan, or run Trivy, execute the following command from the project root:

```bash
podman run --rm -it -v $PWD:/src aquasec/trivy fs /src
```

## Instructions

1. Run the Trivy scan command above in the project's root directory.
2. Review the output and summarize findings by severity (CRITICAL, HIGH, MEDIUM, LOW).
3. Highlight any critical or high severity vulnerabilities that require immediate attention.
4. Suggest remediation steps for the most impactful issues (e.g., upgrading a dependency).
