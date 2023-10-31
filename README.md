# Odds Scrapper

Repo to ramp up on finding positive EV and arbitrage opportunities.

## Project update

Won't be working on this repo anymore privately, or at all I think. Explanation below:

So this project started of from watching this random [Youtube Video](https://www.youtube.com/watch?v=s6R9xB1RdZU&t)

Never knew anything about sports betting before, but thought it would be awesome to create a platform similar to [OddsJam](https://oddsjam.com/) for African markets, since there's no support for said markets in OddsJam, and betting is quite popular in Kenya.

Unfortunately in Kenya as I have found out, all bet winnings are subject to 20% tax, which negatives all positive EV opportunities, which effectively makes any long term profit strategy next to impossible.

This repo would be important for anyone who would still want to find misplaced odds by Kenyan bookies for the short term, and creates a structure that can be extended if you would like to.

## Significant Libraries and Tools

- [Cheerio](https://cheerio.js.org/): Library for parsing html.
- [Puppeteer](https://pptr.dev/): Used for web scrapping sports odds from bookmakers and also fetching true odds from betting exchanges.
- [Redis](https://redis.io/): Used as a pub-sub mechanism to pass events between the core modules.
- [TypeOrm](https://typeorm.io/): Interface with PostgresSQL database.

## Modules

The core modules are designed to be decoupled, and can be deployed independently as well. For scrapping, the scrapping module can be deployed as lambda functions are they are short lived, then result passed on via pub-sub to the other modules.

### Config

Config stores JSON configuration objects for different providers, specifically which urls and game metadata is associated with the webpage to scrape.

### Core

#### Analysis

Analyzes collected odds to find mismatched odds from bookies.

#### Game Events

Functionality for handling specific game event data. Combines the same game event from different providers into a single unified event.

#### Parsers

Functionality for parsing html content from bet providers into useful bet meta data.

#### Scraping

Functionality for fetching raw html data from bet providers and betting exchanges. Each provider requires different web scrapping techniques to get the required data, and this is defined here.
