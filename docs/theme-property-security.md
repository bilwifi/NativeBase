# Theme extraction and package qualification

The maintained theme and v33x theme used standalone lodash.pick and shallow helpers. Selecting an own `__proto__` field can change the returned object's prototype; nil filtering can then copy inherited attacker fields into a theme result. The positive control demonstrates this output-object behavior, not remote exploitability or global Object.prototype pollution.

The candidate uses maintained Lodash 4.18.1 modules in these two utilities. Single-element path arrays preserve the standalone helpers' literal-key behavior: dots and brackets do not become traversal requests. Ordered extraction retains own-key order; complementary extraction and nil filtering also use maintained helpers. The remaining standalone helpers used elsewhere in the library are outside this focused change.

Package qualification exposed two existing build failures. Explicit Babel configs now retain Bob's standalone target defaults without inheriting a parent Browserslist environment map. Input typography now resolves theme and responsive values through the existing font resolver before forwarding native style values; alignment is also resolved before reaching TextInput. Editable/password-input props, callbacks and side elements are retained. Recent Lodash declarations require a newer compiler, so the direct type dependency uses the already-locked 4.14.168 compatible with TypeScript 4.6.

## Validation

On Node 22 with Yarn 1.22.22:

- Frozen installation succeeds with lifecycle hooks disabled.
- `yarn test:security`: fifteen tests execute the actual TypeScript modules with only the native runtime and hook boundaries represented locally. Theme cases cover both variants, literal keys, ordering, inheritance, nil filtering, symbols, frozen input and unsafe fields. Input cases cover theme defaults, responsive custom font variants, supported native values, alignment and editing props.
- Positive controls: master passes eight theme cases and fails the two unsafe-field cases; its Input passes one editing-prop case and fails four typography/alignment cases. The candidate passes all fifteen.
- The same fifteen cases pass against generated CommonJS files in local artifact qualification.
- Targeted lint has zero errors. The ten warnings in the two theme utilities match master; no global lint cleanup is included.
- Full strict TypeScript checking succeeds. `yarn build:library` succeeds for CommonJS and ES modules (611 sources each) and declaration generation.
- Package dry-run inspection includes source, CommonJS, ES modules and the new declaration files. No tarball is published and the package version is unchanged.
- `git diff --check` passes.

The Library security and build workflow replays the frozen installation, regression tests and full build on PRs and master. It has read-only repository access, no publication credential and does not run the release command. The placeholder only satisfies the existing publish-only .npmrc variable; dependencies installed by this job are public.

Before application adoption: publish a separately identified candidate through the existing fork release process, pin that exact package in application PRs, export Android/iOS and qualify on physical devices. None of those application-adoption steps is implied by a green library build.

## Candidate publication

The existing release-it process is retained. `yarn release:securityrc:check` simulates a candidate from clean master; `yarn release:securityrc` uses the same settings for an explicitly initiated publication. The tool computes the next patch prerelease with identifier securityrc, publishes only under the security-rc tag and uses the reviewed candidate notes. It requires master and changes since the last tag. It does not alter latest or run in the test workflow. The initial simulation computed 3.4.29-securityrc.0 automatically, and the two applications' existing ^3.4.28-napp.3 ranges exclude that candidate. No version is incremented merely by adding these commands. Use `patch --preRelease=securityrc` with this conventional-changelog plugin; combining prepatch with that flag incorrectly doubles the pre prefix and can leave the planned version undefined. Validate the simulated version/tag as well as the exit code.

### Manual workflow

`Manual security candidate` runs only on workflow_dispatch from master. Supply its exact reviewed 40-character source SHA. With publish false (the default), it installs the locked dependencies, runs the tests/build and validates the release-it simulation without publishing. A changed source SHA, dirty checkout, invalid version, already-published candidate or unexpected stable tag stops the run.

With publish true, a separate job rebuilds the same source, rechecks the simulation and stable baseline, and executes the existing release recipe. Only this job receives contents/packages write permissions through its ephemeral GITHUB_TOKEN. No personal publication token or new stored secret is required. Concurrency serializes candidate requests; a stale queued SHA fails rather than releasing newer unreviewed source.

The existing package must grant this repository Actions access before the job can publish; repository admin access alone does not prove package access. The final check compares the registry candidate/stable tags, package gitHead, release commit parent, Git tag and GitHub prerelease. A partially completed release is a failure requiring inspection, not an automatic retry. This workflow does not update application dependencies, publish a stable package or submit an app to a store. The legacy Sonar workflow remains separate and requires a valid SONAR_HOST_URL and SONAR_TOKEN; its current missing-server failure is not reported as a passing quality gate.
