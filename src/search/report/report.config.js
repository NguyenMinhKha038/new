const types = {
  user: [
    'general',
    'payment',
    'delivery',
    'order',
    'product',
    'experience',
    'security',
    'refund',
    'promotion',
    'other'
  ],
  company: [
    'general',
    'campaign',
    'legal',
    'payment',
    'delivery',
    'performance',
    'security',
    'refund',
    'other'
  ]
};

const statuses = ['pending', 'handling', 'handled', 'hidden'];

const contentLengths = {
  min: 10,
  max: 4000
};

const maxReportTimesPerDay = 10;

const maxImagesPerReport = 5;

const supportedLanguages = ['vi', 'en'];

const confirmReportContents = {
  vi: {
    title: 'Yêu cầu của bạn đang được xử lý',
    message: 'Yêu cầu của bạn đã được tiếp nhận và sẽ được xử lý trong vòng 24h tới.'
  },
  en: {
    title: 'Your request is being handled',
    message: 'Your request is received and will be handled within the next 24 hours.'
  }
};

export default {
  types,
  statuses,
  contentLengths,
  maxReportTimesPerDay,
  maxImagesPerReport,
  supportedLanguages,
  confirmReportContents
};
