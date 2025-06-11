import Hero from './assets/Hero';
import Navbar from './assets/NavBar';
import Footer from './assets/Footer';
import Deals from './assets/deals';
import RandomKeys from './assets/RandomKeys';
import BrandSection from './assets/Brands';
import Figurines from './assets/NewFigurines';
import CurrencyShop from './assets/CurrencyShop';
import Promo from './assets/Promo';

function App() {
  return (
    <>
        <Navbar />
        <Hero />
        <BrandSection/>
        <RandomKeys/>
        <Deals/>
        <CurrencyShop/>
        <Promo leftLink={''} rightLink={''}/>
        <Figurines/>
        <Footer />
    </>
  );
}

export default App;
