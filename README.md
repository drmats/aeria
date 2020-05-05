# aeria

[IGC](https://www.fai.org/sites/default/files/igc_fr_ts_2016.pdf)-based,
simple air time statistics generator.

<br />




## usage

* install dependencies
    ```bash
    $ npm i
    ```

* build
    ```bash
    $ npm run build
    ```

* run in folder containing IGC files
    ```bash
    $ aeria
    ```

* available options
    ```bash
    $ aeria --help
    usage: aeria [-s|--span=y|m|d] [-r|--raw] [--no-total] [--c|--csv]
    ```

* works well with [pspg] tool:
    ```bash
    $ aeria --csv --span=m | pspg --csv
    ```

</br>




## support

You can support this project via [stellar][stellar] network:

* Payment address: [xcmats*keybase.io][xcmatspayment]
* Stellar account ID: [`GBYUN4PMACWBJ2CXVX2KID3WQOONPKZX2UL4J6ODMIRFCYOB3Z3C44UZ`][addressproof]

<br />




## license

**aeria** is released under the Apache License, Version 2.0. See the
[LICENSE](https://github.com/drmats/aeria/blob/master/LICENSE)
for more details.




[pspg]: https://github.com/okbob/pspg
[stellar]: https://learn.stellar.org
[xcmatspayment]: https://keybase.io/xcmats
[addressproof]: https://keybase.io/xcmats/sigchain#d0999a36b501c4818c15cf813f5a53da5bfe437875d92262be8d285bbb67614e22
