# HYG bright-star catalog attribution

The extended bright-star data in
`src/components/celestialSphere/brightStarCatalog.ts` is derived from the **HYG
Database v4.1** maintained by David Nash. HYG combines data from the Hipparcos,
Yale Bright Star, and Gliese catalogs.

- Source: <https://github.com/astronexus/HYG-Database>
- Version used: HYG Database v4.1 (`hygdata_v41.csv`)
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)

The derived fields used by Heliōra are the Hipparcos identifier, proper name,
J2000 right ascension and declination, apparent magnitude, and spectral class.
Display colors are assigned from spectral class to match the application's
existing visual language.
