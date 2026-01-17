import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import Booking from './pages/Booking';
import BusinessDashboard from './pages/BusinessDashboard';
import BuyDeliver from './pages/BuyDeliver';
import Cancellation from './pages/Cancellation';
import Contact from './pages/Contact';
import CustomerDashboard from './pages/CustomerDashboard';
import DeliveryErrands from './pages/DeliveryErrands';
import DriverDashboard from './pages/DriverDashboard';
import DriverSignup from './pages/DriverSignup';
import HelpAtHome from './pages/HelpAtHome';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Listings from './pages/Listings';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminDashboard": AdminDashboard,
    "Booking": Booking,
    "BusinessDashboard": BusinessDashboard,
    "BuyDeliver": BuyDeliver,
    "Cancellation": Cancellation,
    "Contact": Contact,
    "CustomerDashboard": CustomerDashboard,
    "DeliveryErrands": DeliveryErrands,
    "DriverDashboard": DriverDashboard,
    "DriverSignup": DriverSignup,
    "HelpAtHome": HelpAtHome,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "Listings": Listings,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};