import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 使用时间戳确保用户名唯一
  const timestamp = Date.now();
  
  // 创建测试用户
  const user = await prisma.user.create({
    data: {
      account: `test_user_${timestamp}`,
      name: `测试用户_${timestamp}`,
      avatar: 'https://example.com/avatar.png',
      role: 'user',
    },
  });
  
  console.log('创建的测试用户:', user);
  
  // 创建测试模板
  const template = await prisma.template.create({
    data: {
      title: `测试模板_${timestamp}`,
      content: '<div>这是一个测试模板的内容</div>',
      templateId: `test_${timestamp}`,
      type: '135',
      authorId: user.id,
    },
  });
  
  console.log('创建的测试模板:', template);
  
  // 创建测试分享
  const share = await prisma.share.create({
    data: {
      templateId: template.id,
      userId: user.id,
    },
  });
  
  console.log('创建的测试分享:', share);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 