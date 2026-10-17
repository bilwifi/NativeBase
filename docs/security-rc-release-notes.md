Security qualification candidate for the J-napps NativeBase fork.

- Replace retired standalone lodash.pick in both theme variants with maintained Lodash modules while preserving literal property keys and ordering.
- Resolve Input theme/responsive font and alignment values before forwarding native props; preserve editing callbacks, password-input settings and side elements.
- Isolate library Babel targets from parent workspace configuration and validate CommonJS, ES module and TypeScript declaration builds.
- Add fifteen behavioral regression tests and a read-only CI gate without a package publication credential.

This prerelease is intended for explicit application qualification. It does not change the registry latest tag or publish a mobile application. Exact application pins, Android/iOS exports and physical-device tests remain required before adoption in final store artifacts.
