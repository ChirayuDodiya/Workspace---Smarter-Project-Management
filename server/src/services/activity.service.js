import prisma from '../prisma/client.js';

const createActivityLog = async ({
  subject_type,
  subject_id,
  user_id,
  action,
  properties = {},
}) => {
  const safeProperties = JSON.parse(JSON.stringify(properties));

  return prisma.activity_logs.create({
    data: {
      subject_type,
      subject_id,
      user_id,
      action,
      properties: safeProperties,
    },
  });
};

export { createActivityLog };
