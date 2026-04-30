"""
Lenh seed du lieu mau de test cac tinh nang Quan ly nguoi dung.
Chay: python manage.py seed_data
Xoa va seed lai: python manage.py seed_data --flush
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import User, Role, ActivityLog, Notification, ScamCategory


class Command(BaseCommand):
    help = 'Tao du lieu mau de test tinh nang quan ly nguoi dung'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Xoa toan bo du lieu cu truoc khi seed',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Dang xoa du lieu cu...')
            User.objects.filter(is_superuser=False).delete()
            Role.objects.all().delete()
            ActivityLog.objects.all().delete()
            Notification.objects.all().delete()
            self.stdout.write(self.style.WARNING('Da xoa xong.'))

        # ==========================================
        # 1. TAO ROLES
        # ==========================================
        self.stdout.write('[1/4] Tao Role...')
        role_admin, _ = Role.objects.get_or_create(
            role_name='Admin',
            defaults={'description': 'Quan tri vien he thong'}
        )
        role_user, _ = Role.objects.get_or_create(
            role_name='Nguoi dung',
            defaults={'description': 'Nguoi dung binh thuong'}
        )
        self.stdout.write(self.style.SUCCESS('  OK - Da tao 2 Role'))

        # ==========================================
        # 2. TAO ADMIN ACCOUNTS
        # ==========================================
        self.stdout.write('[2/4] Tao tai khoan Admin...')
        admins = [
            {'username': 'admin_lan', 'email': 'lan@scamalert.vn', 'reputation_score': 500},
            {'username': 'admin_trang', 'email': 'trang@scamalert.vn', 'reputation_score': 450},
        ]
        for data in admins:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'reputation_score': data['reputation_score'],
                    'status': User.UserStatus.ACTIVE,
                    'role': role_admin,
                }
            )
            if created:
                user.set_password('admin123456')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  OK - admin: {user.username}'))
            else:
                self.stdout.write(f'  INFO - Da ton tai: {user.username}')

        # ==========================================
        # 3. TAO USER ACCOUNTS
        # ==========================================
        self.stdout.write('[3/4] Tao tai khoan nguoi dung...')
        admin_ref = User.objects.filter(role=role_admin).first()

        users_data = [
            # 5 Active users
            {'username': 'nguyen_van_a', 'email': 'nguyenvana@gmail.com', 'reputation_score': 150, 'status': User.UserStatus.ACTIVE},
            {'username': 'tran_thi_b', 'email': 'tranthib@gmail.com', 'reputation_score': 90, 'status': User.UserStatus.ACTIVE},
            {'username': 'le_van_c', 'email': 'levanc@gmail.com', 'reputation_score': 200, 'status': User.UserStatus.ACTIVE},
            {'username': 'pham_thi_d', 'email': 'phamthid@gmail.com', 'reputation_score': 300, 'status': User.UserStatus.ACTIVE},
            {'username': 'hoang_van_e', 'email': 'hoangvane@gmail.com', 'reputation_score': 50, 'status': User.UserStatus.ACTIVE},
            # Banned - khoa vinh vien
            {
                'username': 'scammer_01',
                'email': 'scammer01@mail.com',
                'reputation_score': 0,
                'status': User.UserStatus.BANNED,
                'lock_duration': 'forever',
                'lock_reason': 'Lua dao, mao danh to chuc',
                'lock_days_ago': 5,
            },
            # Banned - co thoi han (7 ngay, con ~6 ngay)
            {
                'username': 'spammer_99',
                'email': 'spammer99@mail.com',
                'reputation_score': 10,
                'status': User.UserStatus.BANNED,
                'lock_duration': '7',
                'lock_reason': 'Spam quang cao',
                'lock_days_ago': 1,
            },
            # Banned - DA HET HAN -> test tu dong mo khoa (khoa 3 ngay, tu 10 ngay truoc)
            {
                'username': 'old_banned_user',
                'email': 'oldbanned@mail.com',
                'reputation_score': 30,
                'status': User.UserStatus.BANNED,
                'lock_duration': '3',
                'lock_reason': 'Vi pham lan dau',
                'lock_days_ago': 10,
            },
            # Warning
            {
                'username': 'canh_bao_user',
                'email': 'canhbao@gmail.com',
                'reputation_score': 45,
                'status': User.UserStatus.WARNING,
                'warning_type': 'spam',
                'warning_detail': 'Dang bai spam nhieu lan',
            },
            # Inactive (da xoa mem)
            {
                'username': 'deleted_user_01',
                'email': 'deleted01@mail.com',
                'reputation_score': 0,
                'status': User.UserStatus.INACTIVE,
                'delete_reason': 'Vi pham nghiem trong',
            },
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'reputation_score': data['reputation_score'],
                    'status': data['status'],
                    'role': role_user,
                }
            )
            if created:
                user.set_password('user123456')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  OK - user: {user.username} [{user.status}]'))

                if admin_ref:
                    # Tao ActivityLog + Notification cho khoa tai khoan
                    if data.get('lock_duration'):
                        log_time = timezone.now() - timedelta(days=data.get('lock_days_ago', 1))
                        log = ActivityLog.objects.create(
                            user=admin_ref,
                            action=f"[LOCK_INFO:target={user.username},duration={data['lock_duration']}] Khoa {user.username}. Ly do: {data.get('lock_reason', '')}"
                        )
                        ActivityLog.objects.filter(pk=log.pk).update(created_time=log_time)
                        Notification.objects.create(
                            user=user,
                            content=f"Tai khoan bi khoa {data['lock_duration']} ngay. Ly do: {data.get('lock_reason', '')}"
                        )

                    # Tao ActivityLog + Notification cho canh bao
                    if data.get('warning_type'):
                        ActivityLog.objects.create(
                            user=admin_ref,
                            action=f"Canh bao {user.username}. Loai: {data['warning_type']}. {data.get('warning_detail', '')}"
                        )
                        Notification.objects.create(
                            user=user,
                            content=f"Ban bi canh bao: {data['warning_type']}. {data.get('warning_detail', '')}"
                        )

                    # Tao ActivityLog + Notification cho xoa tai khoan
                    if data.get('delete_reason'):
                        ActivityLog.objects.create(
                            user=admin_ref,
                            action=f"Xoa mem {user.username}. Ly do: {data['delete_reason']}"
                        )
                        Notification.objects.create(
                            user=user,
                            content=f"Tai khoan bi xoa. Ly do: {data['delete_reason']}"
                        )
            else:
                self.stdout.write(f'  INFO - Da ton tai: {user.username}')

        # ==========================================
        # 4. TAO DANH MUC SCAM
        # ==========================================
        self.stdout.write('[4/4] Tao ScamCategory...')
        categories = [
            ('Lua dao dau tu', 'Gia mao san dau tu, tien ao'),
            ('Lua dao tinh cam', 'Ket ban de chiem doat tai san'),
            ('Gia mao co quan nha nuoc', 'Mao danh cong an, toa an'),
            ('Lua dao mua sam online', 'Nhan tien khong giao hang'),
            ('Viec lam lua dao', 'Viec lam luong cao gia mao'),
        ]
        for name, desc in categories:
            ScamCategory.objects.get_or_create(category_name=name, defaults={'description': desc})
        self.stdout.write(self.style.SUCCESS(f'  OK - Da tao {len(categories)} danh muc'))

        # TONG KET
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('SEED HOAN TAT!'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'  Admin:   {User.objects.filter(role=role_admin).count()} tai khoan')
        self.stdout.write(f'  Active:  {User.objects.filter(status=User.UserStatus.ACTIVE).count()} tai khoan')
        self.stdout.write(f'  Banned:  {User.objects.filter(status=User.UserStatus.BANNED).count()} tai khoan')
        self.stdout.write(f'  Warning: {User.objects.filter(status=User.UserStatus.WARNING).count()} tai khoan')
        self.stdout.write(f'  Deleted: {User.objects.filter(status=User.UserStatus.INACTIVE).count()} tai khoan')
        self.stdout.write('')
        self.stdout.write('Luu y:')
        self.stdout.write('  - "old_banned_user" het han khoa 10 ngay truoc -> vao trang Users se tu dong mo')
        self.stdout.write('  - Mat khau admin: admin123456 | user: user123456')
        self.stdout.write('  - Seed lai: python manage.py seed_data --flush')
