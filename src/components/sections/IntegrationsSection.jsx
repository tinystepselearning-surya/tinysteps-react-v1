import { motion } from 'framer-motion';
import { ScrollReveal } from '../ui/ScrollReveal';

const integrations = [
  { name: 'Zoom', icon: '🎥', color: 'from-blue-400 to-blue-600', description: 'Seamless video conferencing for live classes' },
  { name: 'Firebase', icon: '🔥', color: 'from-orange-400 to-red-500', description: 'Real-time database and authentication' },
  { name: 'Google Analytics', icon: '📊', color: 'from-green-400 to-green-600', description: 'Track user engagement and progress' },
  { name: 'Razorpay', icon: '💳', color: 'from-purple-400 to-purple-600', description: 'Secure payment processing for fees' },
  { name: 'SendGrid', icon: '📧', color: 'from-red-400 to-red-600', description: 'Automated email notifications and reports' },
  { name: 'Sentry', icon: '🛡️', color: 'from-gray-500 to-gray-700', description: 'Error monitoring and performance tracking' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const IntegrationsSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal variant="fadeUp" className="text-center mb-20">
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-4xl">🔗</div>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Integrations for Seamless Learning
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Connect Tiny Steps with industry-leading tools to enhance your educational experience, from video calls to secure payments and analytics.
          </p>
        </ScrollReveal>

        {/* Integrations Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.05 }}
              className="group"
            >
              <div className="bg-white rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center hover:shadow-2xl transition-all duration-300 border border-gray-100">
                {/* Icon Container */}
                <motion.div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-4xl mb-4 shadow-lg`}
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {integration.icon}
                </motion.div>

                {/* Name */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {integration.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4">
                  {integration.description}
                </p>

                {/* Hover Accent */}
                <motion.div
                  className={`h-1 w-12 bg-gradient-to-r ${integration.color} rounded-full`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ originX: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits */}
        <motion.div
          className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-12 md:p-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: false }}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Integrate with Tiny Steps?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Effortless Setup',
                description: 'Connect your tools in minutes with our guided integration process. No technical expertise required.',
              },
              {
                icon: '🔄',
                title: 'Automated Workflows',
                description: 'Streamline operations with real-time data sync between platforms, reducing manual work.',
              },
              {
                icon: '🛡️',
                title: 'Enterprise Security',
                description: 'All integrations use secure APIs with end-to-end encryption to protect student and teacher data.',
              },
            ].map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <motion.div
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  {benefit.icon}
                </motion.div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h4>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: false }}
        >
          <p className="text-gray-600 text-lg mb-8">
            Need a specific integration? We're always adding more!
          </p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Integration Docs
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};