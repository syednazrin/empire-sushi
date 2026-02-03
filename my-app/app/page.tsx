import Slide1 from './components/Slide1';
import Slide2 from './components/Slide2';
import Slide3 from './components/Slide3';
import Slide4 from './components/Slide4';
import Slide5 from './components/Slide5';
import PageCounter from './components/PageCounter';

export default function Home() {
  return (
    <main>
      <Slide1 />
      <Slide2 />
      <Slide3 />
      <Slide4 />
      <Slide5 />
      <PageCounter totalSlides={5} />
    </main>
  );
}
