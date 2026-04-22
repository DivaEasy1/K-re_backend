import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kayak-en-re.fr' },
    update: {},
    create: {
      email: 'admin@kayak-en-re.fr',
      password: await hashPassword('Admin@K-Re2026!'),
      name: 'Admin K-Ré',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create sample activities
  const activities = [
    {
      title: 'Apéro Soleil Couchant',
      description: 'Pagayez au coucher du soleil et profitez d\'un apéritif en pleine mer.',
      duration: '2h',
      difficulty: 'EASY',
      price: 25.0,
      priceLabel: 'À partir de 25€',
      icon: '🌅',
      category: 'leisure',
      maxParticipants: 10,
    },
    {
      title: 'Excursion Nature',
      description: 'Explorez les beauté naturelles de l\'île de Ré.',
      duration: '3h',
      difficulty: 'MEDIUM',
      price: 35.0,
      priceLabel: 'À partir de 35€',
      icon: '🌳',
      category: 'discovery',
      maxParticipants: 8,
    },
    {
      title: 'Kayak Sportif',
      description: 'Une expérience intense et dynamique pour les amateurs de sport.',
      duration: '2h30',
      difficulty: 'HARD',
      price: 45.0,
      priceLabel: 'À partir de 45€',
      icon: '💪',
      category: 'sport',
      maxParticipants: 6,
    },
  ];

  for (const activity of activities) {
    const { title, ...rest } = activity;
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[éè]/g, 'e')
      .replace(/[ù]/g, 'u')
      .replace(/[ç]/g, 'c');

    await prisma.activity.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        ...rest,
        isActive: true,
      },
    });

    console.log(`✅ Activity created: ${title}`);
  }

  console.log('🌱 Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e: any) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
