import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const Payments: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/payments']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Payments & invoices</h1>

    <p className="mt-4">Secure payments and clear invoices—check your parent dashboard for receipts.</p>
    <p className="mt-2 text-sm text-gray-700">Contact support for billing questions or payment plans.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Go to your <Link to="/parent/payments" className="text-primary-600">Parent payments</Link> dashboard.</li>
      <li>Download invoices or set up scheduled payments.</li>
      <li>Contact support for payment plans.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Missing invoice notifications due to spam filters.</li>
      <li>Assuming a course auto-renews—check your plan.</li>
    </ul>

    <div className="mt-6">
      <Link to="/parent/payments" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Open payments</Link>
      <Link to="/faq" className="ml-3 text-primary-600">Billing FAQ</Link>
    </div>
  </article>
);

}

export default Payments;
