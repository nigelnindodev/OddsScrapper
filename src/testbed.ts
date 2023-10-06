import { BetikaProvider } from "./bet_providers/betika";
import { BetikaScrapper } from "./core/scrapping/betika";

const betikaProvider = new BetikaProvider();
betikaProvider.getConfig();

const betikaScrapper = new BetikaScrapper();
betikaScrapper.fetchData();

