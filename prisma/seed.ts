import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();
const password = process.env.ADMIN_PASSWORD as string;
async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kayak-en-re.fr' },
    update: {},
    create: {
      email: 'admin@kayak-en-re.fr',
      password: await hashPassword(password),
      name: 'Admin K-Ré',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`Admin user created: ${adminUser.email}`);

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

    console.log(`Activity created: ${title}`);
  }

  // Create stations from JSON data (maintaining order)
  const stations = [
    {
      id: '1',
      name: 'La Rochelle - L\'Houmeau',
      location: 'Plage de l\'Anse de Pampin',
      lat: 46.1909375,
      lng: -1.2008125,
      status: 'OPEN',
      openYear: 2023,
      description: 'Notre première station, idéalement située sur la magnifique plage de l\'Anse de Pampin.',
      image: '/images/stations/lhoumeau2.png',
      bookingUrl: 'https://www.kayakomat.com/fr/location/645384afabb7e61d278d260f',
      equipment: ['kayak_solo', 'kayak_tandem', 'paddle'],
    },
    {
      id: '2',
      name: 'Rivedoux-Plage',
      location: 'Avenue des Dunes',
      lat: 46.1551875,
      lng: -1.2684375,
      status: 'OPEN',
      openYear: 2025,
      description: 'Station ouverte en 2025 à l\'entrée de l\'île, parfaite pour commencer l\'aventure.',
      image: '/images/stations/Rivedoux.png',
      bookingUrl: 'https://www.kayakomat.com/fr/location/66605c1ada2cf9ffb968aa4f',
      equipment: ['kayak_solo', 'kayak_tandem', 'paddle'],
    },
    {
      id: '3',
      name: 'Plage du Pas des Boeufs',
      location: '255 rue Antoine de Saint-Exupéry',
      lat: 46.1789,
      lng: -1.3856,
      status: 'OPEN',
      openYear: 2026,
      description: 'Nouvelle station 2026 au coeur de l\'île, entourée de plages magnifiques.',
      image: '/images/stations/Bois-Plage2.png',
      equipment: ['kayak_solo', 'kayak_tandem', 'paddle'],
    },
    {
      id: '4',
      name: 'Saint-Clément-des-Baleines',
      location: 'La Conche des Baleines',
      lat: 46.222350,
      lng: -1.546167,
      status: 'COMING_SOON',
      openYear: 2027,
      description: 'Bientôt disponible au bout de l\'île, près du célèbre phare des Baleines.',
      image: '/images/stations/Rivedoux2.png',
      equipment: ['kayak_solo', 'paddle'],
    },
    {
      id: '5',
      name: 'Les Portes-en-Ré',
      location: 'Banc des Bucherons',
      lat: 46.247252,
      lng: -1.484094,
      status: 'COMING_SOON',
      openYear: 2027,
      description: 'Ouverture prévue en 2027 Sur l\'une des plages le plus sauvage de l\'île.',
      image: '/images/stations/Bois-Plage1.png',
      equipment: ['kayak_solo', 'paddle'],
    },
    {
      id: '6',
      name: 'Ars en Ré',
      location: 'Au coeur des marais',
      lat: 46.209120,
      lng: -1.4392,
      status: 'COMING_SOON',
      openYear: 2028,
      description: 'Une expérience unique de kayak dans les marais salants de Loix.',
      image: '/images/stations/lhoumeau1.png',
      equipment: ['kayak_solo', 'paddle'],
    },
    {
      id: '7',
      name: 'La Flotte-en-Ré',
      location: 'Port de Saint-Martin',
      lat: 46.2012,
      lng: -1.3634,
      status: 'COMING_SOON',
      openYear: 2028,
      description: 'La station la plus attendue, au coeur de la capitale de l\'île.',
      image: '/images/stations/Rivedoux1.png',
      equipment: ['kayak_solo', 'kayak_tandem', 'paddle'],
    },
  ];

  for (const station of stations) {
    const slug = station.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[ùûü]/g, 'u')
      .replace(/[ôö]/g, 'o')
      .replace(/[îï]/g, 'i')
      .replace(/[ç]/g, 'c')
      .replace(/['-]/g, '');

    await prisma.station.upsert({
      where: { slug },
      update: {},
      create: {
        id: station.id,
        name: station.name,
        slug,
        location: station.location,
        lat: station.lat,
        lng: station.lng,
        description: station.description,
        image: station.image,
        bookingUrl: station.bookingUrl,
        equipment: station.equipment,
        status: station.status as 'OPEN' | 'COMING_SOON' | 'CLOSED' | 'MAINTENANCE',
        openYear: station.openYear,
        isActive: true,
      },
    });

    console.log(`Station created: ${station.name}`);
  }

  console.log('Seed completed!');
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
