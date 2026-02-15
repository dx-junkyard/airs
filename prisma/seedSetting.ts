import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 既存レコードをすべて削除
  await prisma.systemSetting.deleteMany();
  console.log('既存のシステム設定を削除しました。');

  await prisma.systemSetting.create({
    data: {
      value: {
        geofenceAddressPrefix: '',
        eventClusteringTimeMinutes: 60,
        eventClusteringRadiusMeters: 500,
        animalTypesJson: JSON.stringify([
          'monkey',
          'deer',
          'wild_boar',
          'bear',
          'other',
        ]),
        lineSessionTimeoutHours: 24,
        suggestedQuestionsJson: JSON.stringify([
          '今月の通報の傾向を分析して',
          '先月と比べて通報の増減はある？',
          '確認待ちの通報を探して',
          '最近1週間のクマの目撃情報を探して',
          '地域別の通報分布を分析して',
        ]),
        mapDefaultLatitude: 35.6762,
        mapDefaultLongitude: 139.6503,
        mapDefaultDataRange: 'past_1_year',
        domainKnowledgeText: '',
      },
    },
  });

  console.log('システム設定の初期データを作成しました。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
