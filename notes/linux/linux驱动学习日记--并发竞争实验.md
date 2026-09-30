---
title: '（FUCK_10）linux驱动初探---并发竞争实验'
description: '使用原子操作避免竞争'
created: '2026-09-30'
updated: '2026-09-30'
tags: ['linux']
draft: false
---
## 使用原子操作避免竞争

由于内核模块嵌入到的是linux内核当中，因此每次app调用open函数都会访问同一块区域的驱动，以此特性我们可以使用原子操作的函数去避免多线程竞争问题，将结构体新增一名原子成员

```C
struct led_dts_type
{
    struct cdev cdev;      // 字符设备结构体
    dev_t dev_id;          // 设备号
    struct class *class;   // 类
    struct device *device; // 设备
    int major;             // 主设备号
    int minor;             // 从设备号
    struct device_node *nd;// 设备节点
    int led_gpio;          // gpio编号
    atomic_t    gpio_lock; // gpio原子变量
};
```

在模块载入初始化阶段对原子变量进行初始化

```C
dtsled.gpio_lock = (atomic_t)ATOMIC_INIT(0); // 给原子变量初始化默认为0
atomic_set(&dtsled.gpio_lock, 1); // 原子设置变量为1
```

在文件操作函数的open函数中进行检测是否已经有运行的程序占用当前的驱动

```C
static int fp_led_open (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dtsled = container_of(inode->i_cdev, struct led_dts_type, cdev);
    if (!atomic_dec_and_test(&dtsled->gpio_lock)) // 进行检测
    {
        atomic_inc(&dtsled->gpio_lock); // 加回 1
        printk("already open led device \r\n");
        return -EBUSY;
    }

    // atomic_inc(&dtsled->gpio_lock); // 加回 1
    filp->private_data = dtsled;
    printk("fp dts led open \r\n");
    return 0;
}
```

而为了避免因为第一次初始化成功，但是原子数被open函数的第一次判断自减为1，后续再次启动失败的问题，需要在release函数将原子数重新增加到1以代表释放了资源，其它线程可以进行占用

```C
static int fp_led_release (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dtsled = container_of(inode->i_cdev, struct led_dts_type, cdev);
    atomic_inc(&dtsled->gpio_lock); // 加回 1
    printk("exit fp dts led \r\n");
    return 0;
}
```

对于测试app同样延续之前的测试程序，但是有微小改动，当open函数返回句柄小于 0 时会报告错误

```C
fd = open(chr_path, O_RDWR);
if (fd == -1) 
{
    perror("open");
    return -1;
}
```

运行结果如下 (在运行程序指令后加上 & 代表程序后台运行)

```Shell
root@ATK-DLRK3568:/home/ftp# ./led_dts_test_app /dev/gpioled &
[1] 1314
root@ATK-DLRK3568:/home/ftp# [  279.156431] fp dts led open
led_dts_test_app
root@ATK-DLRK3568:/home/ftp# ./led_dts_test_app /dev/gpioled &
[2] 1315
root@ATK-DLRK3568:/home/ftp# led_dts_test_app
[  281.587572] already open led device
open: Device or resource busy
[2]+  Done(255)               ./led_dts_test_app /dev/gpioled
root@ATK-DLRK3568:/home/ftp#
```

可以看到第一次程序正常后台运行，再次打开相同程序会报驱动被占用的报错，符合实验预期

## 使用自旋锁避免竞争

使用相同的逻辑我们将原子操作更改为自旋锁，以下为更改源代码，增加自旋锁和设备状态结构体成员

```C
struct led_dts_type
{
    struct cdev cdev;      // 字符设备结构体
    dev_t dev_id;          // 设备号
    struct class *class;   // 类
    struct device *device; // 设备
    int major;             // 主设备号
    int minor;             // 从设备号
    struct device_node *nd;// 设备节点
    int led_gpio;          // gpio编号
    bool status;           // 设备状态
    spinlock_t lock;       // 自旋锁
};
```

并在模块载入阶段对自旋锁初始化

```C
spin_lock_init(&dtsled.lock); // 初始化自旋锁
```

同样在文件操作open和release需要对设备状态进行加锁处理

```C
static int fp_led_open (struct inode *inode, struct file *filp)
{
    unsigned long flags;
    struct led_dts_type *dtsled = container_of(inode->i_cdev, struct led_dts_type, cdev);
    spin_lock_irqsave(&dtsled->lock, flags); // 自旋锁加锁 保存中断状态
    if (dtsled->status) // 如果status为true，就是正在运行
    {   
        // 解锁
        spin_unlock_irqrestore(&dtsled->lock, flags); 
        return -EBUSY;
    }
    dtsled->status = true; // 如果没有运行则运行状态
    spin_unlock_irqrestore(&dtsled->lock, flags); // 解锁
    filp->private_data = dtsled;
    printk("fp dts led open \r\n");
    return 0;
}
```

```C
static int fp_led_release (struct inode *inode, struct file *filp)
{
    unsigned long flags;
    struct led_dts_type *dev = filp->private_data;
    // 加锁
    spin_lock_irqsave(&dev->lock, flags);
    dev->status = false;
    // 释放锁
    spin_unlock_irqrestore(&dev->lock, flags);
    printk("exit fp dts led \r\n");
    return 0;
}
```

对此对测试的应用程序进行改动

```C
  fd = open(chr_path, O_RDWR);
  if (fd < 0)
  {
      perror("error:");
      return fd;
  }
  int fd2 = open(chr_path, O_RDWR);  /* 再次打开，验证独占保护 */
  if (fd2 < 0)
      perror("second open");
  else
      close(fd2);
```

在原有的基础上增加二次open验证独占保护的机制，最终得到的效果如下

```Shell
root@ATK-DLRK3568:/lib/modules# insmod led_spin_lock_module.ko
[ 2802.172403] find node /gpio_led
[ 2802.172466] led gpio: 16
[ 2802.172582] major: 510 minor: 0
[ 2802.172995] dts led module init success
root@ATK-DLRK3568:/lib/modules# cd /home/ftp/
root@ATK-DLRK3568:/home/ftp# ls
chardev_app  led_dts_test_app  led_test_app  spin_lock_test_app
root@ATK-DLRK3568:/home/ftp# ./spin_lock_test_app /dev/gpioled
led_dts_test_app
[ 2819.605659] fp dts led open
second open: Device or resource busy
```

可以看到程序正常运行，第一次正常打开，第二次打开失败，并说明设备被占用

## 使用信号量避免竞争

同样我们使用信号量的方法去规避掉竞争的现象，我们重新修改led的字符描述结构体，新增信号量的成员

```C
struct led_dts_type
{
    struct cdev cdev;      // 字符设备结构体
    dev_t dev_id;          // 设备号
    struct class *class;   // 类
    struct device *device; // 设备
    int major;             // 主设备号
    int minor;             // 从设备号
    struct device_node *nd;// 设备节点
    int led_gpio;          // gpio编号
    struct semaphore sem;  // 定义信号量
};
```

依旧标准流程，在载入模块的初始化函数对信号量进行初始化

```C
sema_init(&dtsled.sem, 1); // 初始化信号量
```

对于文件操作函数进行修改，在应用app进行open操作时，需要获取信号量，同时在close时释放信号量

```C
static int fp_led_open (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dtsled = container_of(inode->i_cdev, struct led_dts_type, cdev);
  
    // 获取信号量 看看是否还有余量去占用
    if (down_interruptible(&dtsled->sem))
    {
        printk("signal not enough \r\n");
        return -ERESTARTSYS;
    }
    // // 信号量 -1， 表示占用
    // down(&dtsled->sem);
    filp->private_data = dtsled;
    printk("fp dts led open \r\n");
    return 0;
}
```

```C
static int fp_led_release (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dev = filp->private_data;
    // 释放信号量
    up(&dev->sem);
    printk("exit fp dts led \r\n");
    return 0;
}
```

而由于信号量的特性，也就是如果获取信号量失败的时候，会让进程进入休眠，从而释放cpu，因此表现在程序上就是就算获取信号量失败的时候也不会退出进程，因此我们对每个进程打印对应的pid进程号

```C
printf("pid: %d \r\n", getpid());
```

最终的实验结果如下，当我启动了两个进程，第一个进程正常启动led驱动，执行闪烁任务，第二个进程由于第一个进程的资源占用，处于休眠，当我手动kill第一个进程，第二个进程获得信号量并占用，继续执行led闪烁任务。

```Shell
root@ATK-DLRK3568:/lib/modules# insmod led_semaphore_module.ko
[ 3196.447805] find node /gpio_led
[ 3196.447870] led gpio: 16
[ 3196.447983] major: 508 minor: 0
[ 3196.448525] dts led module init success
root@ATK-DLRK3568:/lib/modules# cd /home/ftp/
root@ATK-DLRK3568:/home/ftp# ls
chardev_app       led_test_app        spin_lock_test_app
led_dts_test_app  semaphore_test_app
root@ATK-DLRK3568:/home/ftp# ./semaphore_test_app /dev/gpioled &
[1] 1378
root@ATK-DLRK3568:/home/ftp# led_dts_test_app
pid: 1378
[ 3231.634156] fp dts led open

root@ATK-DLRK3568:/home/ftp# ./semaphore_test_app /dev/gpioled &
[2] 1379
root@ATK-DLRK3568:/home/ftp# led_dts_test_app
pid: 1379

root@ATK-DLRK3568:/home/ftp#
root@ATK-DLRK3568:/home/ftp#
root@ATK-DLRK3568:/home/ftp# kill 1378
[ 3253.371746] exit fp dts led
root@ATK-DLRK3568:/home/ftp# [ 3253.371758] fp dts led open
```

## 互斥锁避免竞争

再次更换一种方式去实现，使用互斥锁去避免竞争，依然修改一下结构体，增加互斥锁结构体成员

```C
struct led_dts_type
{
    struct cdev cdev;      // 字符设备结构体
    dev_t dev_id;          // 设备号
    struct class *class;   // 类
    struct device *device; // 设备
    int major;             // 主设备号
    int minor;             // 从设备号
    struct device_node *nd;// 设备节点
    int led_gpio;          // gpio编号
    struct mutex mutex;    // 声明互斥锁
};
```

并再模块初始化中对互斥锁进行初始化

```C
mutex_init(&dtsled.mutex); // 初始化互斥锁
```

同样在文件操作的初始化和退出的函数中加上请求互斥锁和释放互斥锁

```C
static int fp_led_open (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dtsled = container_of(inode->i_cdev, struct led_dts_type, cdev);
    // 获取互斥锁 可以被中断的 
    // mutex_lock 不可以被中断
    if (mutex_lock_interruptible(&dtsled->mutex))
    {
        return -ERESTARTSYS;
    }
    filp->private_data = dtsled;
    printk("fp dts led open \r\n");
    return 0;
}
```

```C
static int fp_led_release (struct inode *inode, struct file *filp)
{
    struct led_dts_type *dev = filp->private_data;
    mutex_unlock(&dev->mutex);
    printk("exit fp dts led \r\n");
    return 0;
}
```

最终得到的结果和信号量的结果是一致的

```Shell
root@ATK-DLRK3568:/home/ftp# ./mutex_test_app /dev/gpioled &
[1] 1448
root@ATK-DLRK3568:/home/ftp# [ 4622.156523] fp dts led open
led_dts_test_app
pid: 1448
pid: 1448 fd: 3

root@ATK-DLRK3568:/home/ftp# ./mutex_test_app /dev/gpioled &
[2] 1449
root@ATK-DLRK3568:/home/ftp# led_dts_test_app
pid: 1449

root@ATK-DLRK3568:/home/ftp#
root@ATK-DLRK3568:/home/ftp# kill 1448
root@ATK-DLRK3568:/home/ftp# [ 4637.260687] exit fp dts led
pid: 1449 fd: 3
[ 4637.260696] fp dts led open
```

## 总结

从实验的现象来看，原子操作，自旋锁，互斥锁，信号量，都可以很有效的解决多线程的并发竞争问题，但是主要的关键就是对什么进行保护，会产生并发的是什么内容。因此需要根据实际的项目情况去界定哪些需要原子操作，哪些需要锁操作。

在实际的实验过程中 出现了比较愚蠢的现象 对于down_interruptible函数和down函数实际产生的效果是一样的都是会将信号量减一，但是区别是第一个信号量请求如果失败进入休眠模式可以被中断，第二个不行。但是我错误的认为第一个作为判断函数，第二个才是真正的信号量减一函数，导致了运行程序之后就阻塞在down() 函数中，同理mutex。后续编写项目需要警惕
