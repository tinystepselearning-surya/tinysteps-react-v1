"use client"

import React from "react";

// Lightweight local Card, CardContent and Button so this component
// doesn't depend on a shadcn/ui setup being present in the repo.
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`bg-white ${className}`}>{children}</div>
);

const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Button: React.FC<React.PropsWithChildren<{ className?: string; size?: string }>> = ({ children, className = '' }) => (
  <button className={`inline-flex items-center justify-center px-5 py-3 rounded-md font-medium ${className}`}>{children}</button>
);

// Small inline SVG icon components (simple, dependency-free)
const StarIcon = (props: { className?: string }) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.87 1.401-8.168L.132 9.21l8.2-1.192z" />
  </svg>
);

const UsersIcon = (props: { className?: string }) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM6 11c1.657 0 3-1.343 3-3S7.657 5 6 5 3 6.343 3 8s1.343 3 3 3zM6 13c-2.673 0-8 1.337-8 4v2h20v-2c0-2.663-5.327-4-8-4H6zM16 13c-.29 0-.576.01-.857.03C15.777 13.68 17 15 17 16v2h5v-2c0-2.663-5.327-4-6-4z" />
  </svg>
);

const MessageHeartIcon = (props: { className?: string }) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8.5 9.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5S12.38 12 11 12s-2.5-1.12-2.5-2.5z" />
  </svg>
);

const BrainIcon = (props: { className?: string }) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a4 4 0 00-4 4v1H6a4 4 0 000 8h2v1a4 4 0 004 4 4 4 0 004-4v-1h2a4 4 0 000-8h-2V6a4 4 0 00-4-4z" />
  </svg>
);

export default function WhyChooseUs() {
  const features = [
    {
      icon: <StarIcon className="w-8 h-8 text-indigo-600" />,
      title: "Speak confidently, anytime!",
      desc: "Be a star in every discussion. Inspire those around you."
    },
    {
      icon: <UsersIcon className="w-8 h-8 text-teal-600" />,
      title: "Learn & develop holistically",
      desc: "Get better at comprehension and participate actively."
    },
    {
      icon: <MessageHeartIcon className="w-8 h-8 text-orange-600" />,
      title: "Get set for the future!",
      desc: "Effective communication is the ticket to lifelong success."
    },
    {
      icon: <BrainIcon className="w-8 h-8 text-green-600" />,
      title: "Think & speak fluently",
      desc: "Don’t translate from mother tongue. Speak intuitively."
    }
  ];

  return (
    <section className="w-full bg-[#e6f5f8] py-16 px-4 md:px-12 rounded-3xl mt-12">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">
          Speak better, Step up <span role="img" aria-label="sparkles">🌟</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {features.map((item, i) => (
            <Card key={i} className="rounded-xl shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]">
              <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                {item.icon}
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          size="lg"
          className="bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:scale-105 transition-transform text-white text-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M16.57 13.36c-.2-.1-1.19-.6-1.37-.67s-.32-.1-.46.1c-.13.2-.52.67-.64.8-.12.13-.24.15-.44.05-.2-.1-.83-.3-1.57-.96a5.87 5.87 0 01-1.07-1.34c-.11-.2 0-.3.08-.4.08-.1.2-.23.3-.35.1-.12.14-.2.21-.33.07-.13.04-.25-.02-.36-.05-.1-.46-1.1-.63-1.5-.16-.4-.32-.35-.46-.35-.13 0-.27-.01-.41-.01-.14 0-.37.05-.57.25s-.75.73-.75 1.8c0 1.06.77 2.1.88 2.24.1.13 1.5 2.3 3.6 3.24.5.22.9.35 1.21.44.51.16.98.13 1.35.08.41-.06 1.26-.52 1.44-1.03.18-.5.18-.92.13-1.02-.04-.1-.19-.15-.4-.25zM12.03 2.01C6.48 2.01 2.01 6.48 2.01 12.02c0 1.82.48 3.52 1.31 5l-1.41 5.18 5.29-1.38a9.99 9.99 0 004.83 1.23c5.55 0 10.02-4.47 10.02-10.02S17.58 2.01 12.03 2.01z" />
          </svg>
          Connect with us
        </Button>
      </div>
    </section>
  );
}
