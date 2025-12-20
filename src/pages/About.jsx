import { Text } from '@cloudflare/kumo'

export default function About() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 text-left">
          <Text as="h1" size="6xl" weight="bold" className="mb-6 text-5xl md:text-6xl lg:text-7xl text-left">
            Execution is No Longer the Bottleneck.
          </Text>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none text-left">
          <Text size="lg" className="leading-relaxed mb-6 text-left">
            Welcome to the PX Lab showcase. We are entering a new era of Product Experience where the distance between a spark of imagination and a deployed application is shorter than ever.
          </Text>

          <Text size="lg" className="leading-relaxed mb-6 text-left">
            By leveraging Cloudflare's products especially Workers AI and the emerging practice of Vibe Coding, we are empowering our members to bypass the technical grind. This isn't just about building faster; it's about freeing your mind to focus on what truly matters: the strategy, the "why," and the questions worth answering.
          </Text>

          <Text size="lg" className="leading-relaxed text-left">
            Here, we celebrate the designers and builders who are using AI to execute instantly so they can think deeply. Submit your projects—whether built with Cloudflare's edge infrastructure or generated through natural language—and show us what happens when the barrier to building disappears.
          </Text>
        </div>
      </div>
    </div>
  )
}
