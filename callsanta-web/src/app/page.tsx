import Link from "next/link";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import { Snowfall, Footer } from "@/components/layout";

// Icons as simple SVG components
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// FAQ Accordion Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-gray-200 py-4">
      <summary className="flex justify-between items-center cursor-pointer list-none">
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDownIcon className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-4 text-gray-600 leading-relaxed">{answer}</p>
    </details>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Snowfall />

      {/* Hero Section */}
      <section className="relative min-h-screen festive-gradient overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-8">
            <SparklesIcon className="w-4 h-4" />
            <span>Limited spots available for Christmas 2025</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            A Real Phone Call
            <br />
            <span className="text-santa-gold">From Santa Claus</span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10">
            Give your child the most magical gift this Christmas - a personalized phone call from Santa himself!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/book">
              <Button size="lg" className="animate-pulse-glow text-lg px-10 py-5">
                Book Santa&apos;s Call Now
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-[#165B33] hover:!text-white hover:!border-[#165B33]">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-blue-100">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-santa-gold" />
              <span>100% Personalized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-santa-gold" />
              <span>Real-time Conversation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-santa-gold" />
              <span>Recording Available</span>
            </div>
          </div>

          {/* Santa illustration placeholder */}
          <div className="mt-16 animate-float">
            <div className="text-8xl">🎅</div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fffdf7"/>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-[#fffdf7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In just three simple steps, your child will receive a magical call from Santa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card variant="festive" className="text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-santa-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <CardContent className="pt-8">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                  Tell Us About Your Child
                </h3>
                <p className="text-gray-600">
                  Share details about your child - their name, age, interests, and what they want for Christmas.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card variant="festive" className="text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-santa-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <CardContent className="pt-8">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                  Schedule the Call
                </h3>
                <p className="text-gray-600">
                  Pick the perfect time for Santa to call. Choose &quot;Call Now&quot; or schedule for later.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card variant="festive" className="text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-santa-red text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <CardContent className="pt-8">
                <div className="text-5xl mb-4">🎄</div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                  Watch the Magic Happen
                </h3>
                <p className="text-gray-600">
                  Santa calls your child for a personalized conversation they&apos;ll never forget!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Makes Our Calls Special
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every detail is crafted to create an unforgettable experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated" className="text-center">
              <CardContent>
                <div className="w-14 h-14 bg-santa-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-7 h-7 text-santa-red" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fully Personalized</h3>
                <p className="text-gray-600 text-sm">
                  Santa knows your child&apos;s name, age, interests, and gift wishes
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent>
                <div className="w-14 h-14 bg-santa-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneIcon className="w-7 h-7 text-santa-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real Conversation</h3>
                <p className="text-gray-600 text-sm">
                  An interactive call where Santa listens and responds naturally
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent>
                <div className="w-14 h-14 bg-santa-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GiftIcon className="w-7 h-7 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gift Guidance</h3>
                <p className="text-gray-600 text-sm">
                  Santa adjusts gift promises based on your budget preferences
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent>
                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-7 h-7 text-pink-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Keepsake Recording</h3>
                <p className="text-gray-600 text-sm">
                  Optional recording to treasure this magical moment forever
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-santa-cream/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Magical Pricing
            </h2>
            <p className="text-xl text-gray-600">
              One price for an unforgettable experience
            </p>
          </div>

          <Card variant="festive" className="max-w-md mx-auto overflow-hidden">
            <div className="bg-santa-red text-white text-center py-4">
              <span className="text-sm uppercase tracking-wider">Most Popular</span>
            </div>
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Santa&apos;s Phone Call
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-santa-red">$9.99</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0" />
                  <span className="text-gray-700">Personalized 3-minute call</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0" />
                  <span className="text-gray-700">Real-time interactive conversation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0" />
                  <span className="text-gray-700">Schedule anytime or call now</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0" />
                  <span className="text-gray-700">Email transcript after the call</span>
                </li>
              </ul>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex items-center justify-between text-gray-700 mb-2">
                  <span>Add Recording</span>
                  <span className="font-semibold">+$4.99</span>
                </div>
                <p className="text-sm text-gray-500">
                  Keep this magical memory forever
                </p>
              </div>

              <Link href="/book" className="block">
                <Button className="w-full !bg-[#C41E3A] !text-white hover:!bg-red-800" size="lg">
                  Book Santa&apos;s Call
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Santa&apos;s calls
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <FAQItem
              question="How does Santa know about my child?"
              answer="When you book a call, you'll provide details about your child including their name, age, interests, recent achievements, and what they want for Christmas. Santa uses this information to have a natural, personalized conversation."
            />
            <FAQItem
              question="How long is each call?"
              answer="Each call lasts approximately 3 minutes - the perfect length for an exciting conversation without losing a young child's attention. Santa will talk about their interests, ask about their Christmas wishes, and remind them to be good!"
            />
            <FAQItem
              question="Can I schedule the call in advance?"
              answer="Yes! You can schedule the call for a specific date and time that works for your family. You can also choose 'Call Now' if you want Santa to call immediately after payment."
            />
            <FAQItem
              question="What if my child doesn't answer?"
              answer="If the call isn't answered, don't worry! We'll send you an email with instructions to reschedule at no extra cost. We want to make sure every child gets their magical moment with Santa."
            />
            <FAQItem
              question="Is the recording worth it?"
              answer="Many parents tell us the recording becomes a treasured family keepsake. You can play it back every Christmas, share it with grandparents, and your child will love hearing it as they grow up. It's a magical memory preserved forever!"
            />
            <FAQItem
              question="What ages is this appropriate for?"
              answer="Our calls are designed for children ages 3-12, but we've had successful calls with children of all ages! For younger children (3-5), we recommend having a parent nearby to help with the conversation."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 festive-gradient relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🎅🎄🎁</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Make This Christmas Unforgettable
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of families who have created magical memories with a phone call from Santa Claus.
          </p>
          <Link href="/book">
            <Button size="lg" className="animate-pulse-glow text-lg px-10 py-5">
              Book Santa&apos;s Call Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
