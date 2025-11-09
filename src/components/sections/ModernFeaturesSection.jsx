// @ts-nocheck
import { motion } from 'framer-motion';
import { ModernCard } from '../ui/ModernCard';

const featuresData = [
  {
    id: 'for-parents',
    title: 'For Parents',
    description: 'Stay connected with your child\'s learning journey through real-time updates and progress tracking',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-blue-400 to-blue-600',
    badge: 'Family',
    stats: [
      { value: '24/7', label: 'Access' },
      { value: '100%', label: 'Updates' },
    ],
  },
  {
    id: 'for-teachers',
    title: 'For Teachers',
    description: 'Streamline lesson planning, attendance tracking, and student progress reporting with ease',
    icon: '👩‍🏫',
    color: 'from-amber-400 to-orange-500',
    badge: 'Educators',
    stats: [
      { value: '50+', label: 'Tools' },
      { value: '95%', label: 'Efficiency' },
    ],
  },
  {
    id: 'for-lps',
    title: 'For Learning Partners',
    description: 'Oversee multiple families and teachers with comprehensive dashboards and relationship management',
    icon: '🤝',
    color: 'from-purple-400 to-purple-600',
    badge: 'Management',
    stats: [
      { value: '360°', label: 'View' },
      { value: '99%', label: 'Accuracy' },
    ],
  },
];

const additionalFeatures = [
  {
    title: 'Interactive Learning Games',
    description: 'Engage children with fun, educational games that reinforce classroom learning',
    icon: '🎮',
    color: 'from-indigo-400 to-indigo-600',
    hoverEffect: 'glow',
  },
  {
    title: 'Progress Analytics',
    description: 'Track learning milestones and identify areas for improvement with detailed analytics',
    icon: '📈',
    color: 'from-emerald-400 to-emerald-600',
    hoverEffect: 'glow',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

export const ModernFeaturesSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for Every Role
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tailored solutions designed to streamline education and empower every stakeholder in your child's learning journey
          </p>
        </motion.div>

        {/* Main Features Grid - 3 Columns */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featuresData.map((feature, index) => (
            <ModernCard
              key={feature.id}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              badge={feature.badge}
              stats={feature.stats}
              delay={index * 0.12}
              onClick={() => console.log(`Learn more about ${feature.title}`)}
            />
          ))}
        </motion.div>

        {/* Secondary Features Grid - 2 Columns */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden p-8 group"
              whileHover={{ y: -8 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-3 transition-opacity duration-300`} />

              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-6`}
                whileHover={{ rotate: 12, scale: 1.15 }}
              >
                {feature.icon}
              </motion.div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              <motion.div
                className={`mt-6 h-1 w-12 bg-gradient-to-r ${feature.color} rounded-full`}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ delay: index * 0.15 + 0.4, duration: 0.6 }}
                style={{ originX: 0 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-gray-600 mb-8">
            Ready to transform your child's learning experience?
          </p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};