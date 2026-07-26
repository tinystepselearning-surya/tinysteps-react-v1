import Button from '../Button/Button';

const HowToStartSection: React.FC = () => {
  return (
    <section id="book-assessment" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Start With One Free 35-Minute Demo Assessment Class</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-6 text-gray-800">
          <p>Your child's first Tiny Steps class is completely free. This is NOT a sales pitch — it’s a real learning session where we:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Meet your child and understand their personality</li>
            <li>Assess their current English level honestly</li>
            <li>Identify specific needs (phonics? confidence? both?)</li>
            <li>Create a personalized plan only for YOUR child</li>
          </ul>
          <p>You’ll receive a detailed report after the class. Transparent. No commitment.</p>
          <p className="text-sm text-gray-600">Duration: 20–25 minutes • Time: 5 AM to 10 PM IST • Platform: Zoom</p>
          <div className="mt-6 flex justify-center">
            <Button size="lg">BOOK YOUR FREE CLASS</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToStartSection;
