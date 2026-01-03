import ImmersiveHero from './_components/home/ImmersiveHero'
import AboutSection from './_components/home/AboutSection'
import ArticlesSection from './_components/home/ArticlesSection'
import LogbookSection from './_components/home/LogbookSection'
import ConnectSection from './_components/home/ConnectSection'

export default function Home() {
  return (
    <main>
      <ImmersiveHero />
      <AboutSection />
      <ArticlesSection />
      <LogbookSection />
      <ConnectSection />
    </main>
  )
}
