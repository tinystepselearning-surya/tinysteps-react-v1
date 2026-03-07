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

    <div className="mt-4 rounded-lg bg-teal-50 p-4 border border-teal-200">
      <p className="text-sm font-medium text-teal-900">
        All transactions are secure and transparent. We provide clear invoices, flexible payment options, and fast support for any billing questions.
      </p>
    </div>

    <p className="mt-4">Secure payments and clear invoices help families stay on top of plans and renewals.</p>
    <p className="mt-2 text-sm text-gray-700">Contact support for billing questions or payment plans.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Review your current plan and billing details on the pricing page.</li>
      <li>Keep invoices handy for renewals, reimbursements, or school records.</li>
      <li>Contact support for payment plans or invoice help.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Missing invoice notifications due to spam filters.</li>
      <li>Assuming a course auto-renews—check your plan.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/pricing" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        View pricing and plans →
      </Link>
      <Link to="/contact" className="text-primary-600 text-sm font-medium hover:underline">
        Use the contact form for payment plan options
      </Link>
      <a href="https://wa.me/919618398383" target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium hover:underline">
        Chat on WhatsApp - opens new window
      </a>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Payment details</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Invoices:</strong> Each transaction generates an invoice you can request from the Tiny Steps team for tax or personal records.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Payment plans:</strong> Contact our team through the contact form or WhatsApp to discuss monthly payment options, discounts, or refund eligibility.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Course validity:</strong> Check your plan terms at booking time. Some plans renew manually, so confirm your renewal schedule with the team.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default Payments;
