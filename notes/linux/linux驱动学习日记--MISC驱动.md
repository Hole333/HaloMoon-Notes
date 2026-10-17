---
title: '(FUCK_18) linux驱动初探---MISC驱动'
description: 'MISC驱动也被称之为杂项驱动，也就是板子上的外设无法进行分类就可以被称之为MISC驱动。通常嵌套在platform总线驱动中，实现复杂驱动。'
created: '2026-10-17'
updated: '2026-10-17'
tags: ['linux']
draft: false
---
MISC驱动也被称之为杂项驱动，也就是板子上的外设无法进行分类就可以被称之为MISC驱动。通常嵌套在platform总线驱动中，实现复杂驱动。

## MISC设备驱动简介

所有MISC设备驱动主设备号都为10，不同的设备使用不同的从设备号。MISC设备会自动创建cdev，因此可以简化字符设备驱动的编写。而对于MISC设备在linux内核当中的结构体如下

```C
1  struct miscdevice  { 
2    int minor;         /* 子设备号   */ 
3    const char *name;       /* 设备名字   */ 
4    const struct file_operations *fops;  /* 设备操作集  */ 
5    struct list_head list; 
6    struct device *parent; 
7    struct device *this_device; 
8    const struct attribute_group **groups; 
9    const char *nodename; 
10   umode_t mode; 
11 };
```

	定义一个MISC设备(miscdevice类型)以后我们需要设置minor、name和fops这三个成员变量。minor表示子设备号，MISC设备的主设备号为10，这个是固定的，需要用户指定子设备号，Linux系统已经预定义了一些MISC设备的子设备号，这些预定义的子设备号定义在include/linux/miscdevice.h文件中，如下所示：

```C
1  #define PSMOUSE_MINOR          1 
2  #define MS_BUSMOUSE_MINOR      2   /* unused */ 
3  #define ATIXL_BUSMOUSE_MINOR  3   /* unused */ 
4  /*#define AMIGAMOUSE_MINOR     4   FIXME OBSOLETE */ 
5  #define ATARIMOUSE_MINOR    5   /* unused */ 
6  #define SUN_MOUSE_MINOR        6   /* unused */ 
...... 
47 #define MISC_DYNAMIC_MINOR    255
```

我们在使用的时候可以从这些预定义的子设备号中挑选一个，当然也可以自己定义，只要这个子设备号没有被其他设备使用接口。

name就是此MISC设备名字，当此设备注册成功以后就会在/dev目录下生成一个名为name的设备文件。fops就是字符设备的操作集合，MISC设备驱动最终是需要使用用户提供的fops操作集合。

当设置好miscdevice以后就需要使用misc_register函数向系统中注册一个MISC设备，函数原型如下：

```C
int misc_register(struct miscdevice * misc) 
```

* misc：要注册的MISC设备。
* 返回值：负数，失败；0，成功。

当我们卸载设备驱动模块的时候需要调用misc_deregister函数来注销掉MISC设备，函数原型如下：

```C
int misc_deregister(struct miscdevice *misc) 
```

* misc：要注销的MISC设备。
* 返回值：负数，失败；0，成功。

## 实验

相对于其它的字符设备驱动的代码编写，MISC驱动设备的编写相比较更容易，MISC设备由内核自动执行了字符设备的初始化的流程，以及字符设备的反初始化流程

```C
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/cdev.h>
#include <linux/io.h>
#include <linux/platform_device.h>
#include <linux/resource.h>
#include <linux/of_device.h>
#include <linux/device.h>
#include <linux/gpio.h>
#include <linux/of_gpio.h>
#include <linux/miscdevice.h>

#define LED_CNT (1)
#define LEDDEV_NAME ("dtsmiscled")
#define MISCLED_MINOR (15)
#define LED_OFF (0)
#define LED_ON  (1)

static int led_open(struct inode *inode , struct file *filp);
static ssize_t led_write(struct file *filp, const char __user *buff, size_t cnt, loff_t *loff);

struct leddev_dev{
    dev_t devid; // 设备号
    struct cdev cdev;  // 设备类
    struct class *class; // 类
    struct device *device; // 设备
    int gpio_led;   // gpio 号
};

struct leddev_dev led_dev;

struct file_operations fp = 
{
    .owner = THIS_MODULE,
    .open = led_open,
    .release = NULL,
    .write = led_write,
};

struct resouces_t
{
    struct resource *ledsource;
    int ressize;
};

// misc 结构体
static struct miscdevice led_miscdev = 
{
    .minor = MISCLED_MINOR,
    .name  = LEDDEV_NAME,
    .fops  = &fp,
};


void led_switch(uint8_t sta)
{
    if (sta == LED_ON || sta == LED_OFF) 
    {
        gpio_set_value(led_dev.gpio_led, sta);
    }   
    else
    {
        printk("unknown operation \r\n");
    }
}



static int led_open(struct inode *inode , struct file *filp)
{
    printk("led fp open \r\n");
    return 0;
}

static ssize_t led_write(struct file *filp, const char __user *buff, size_t cnt, loff_t *loff)
{
    int ret = 0;
    uint8_t databuf[1];
    ret = copy_from_user(databuf, buff, cnt);
    if (ret < 0)
    {
        printk("kernel write failed \r\n");
        return -EFAULT;
    }

    if (databuf[0] == LED_ON)
    {
        led_switch(LED_ON);
    }
    else if (databuf[0] == LED_OFF)
    {
        led_switch(LED_OFF);
    }
    return cnt;
}

static int led_gpio_init(struct device_node *nd)
{
    int ret = 0;
    led_dev.gpio_led = of_get_named_gpio(nd, "miscled-gpio", 0);
    if (!gpio_is_valid(led_dev.gpio_led))
    {
        printk(KERN_ERR"leddev: failed to get led-gpio \r\n");
        return -EINVAL;
    }

    ret = gpio_request(led_dev.gpio_led, "LED");
    if (ret)
    {
        printk(KERN_ERR"led: failed to reuqest \r\n");
        return ret;
    }
    gpio_direction_output(led_dev.gpio_led, 0);
    return 0;
}

static int led_probe(struct platform_device *dev)
{
    int ret = 0;
    printk("led driver and device matched \r\n");
    ret = led_gpio_init(dev->dev.of_node);
    if (ret < 0)
    {
        return ret;
    }
    ret = misc_register(&led_miscdev);
    if (ret < 0)
    {
        goto free_gpio;
    }
    return 0;
free_gpio:
    gpio_free(led_dev.gpio_led);
    return -EINVAL;
}

static int led_remove(struct platform_device *dev)
{
    gpio_set_value(led_dev.gpio_led, 0);
    gpio_free(led_dev.gpio_led);
    misc_deregister(&led_miscdev);
    printk("led removed \r\n");
    return 0;
}


// 匹配表
static const struct of_device_id led_of_match[] = 
{
    {.compatible = "alientek,miscled"},
    {/*..todo*/}
};

static struct platform_driver led_driver = 
{
    .driver = 
    {
        .name  = "alientek,miscled",
        .of_match_table = led_of_match,
    },
    .probe = led_probe,
    .remove = led_remove, 
};

static int __init led_driver_init(void)
{
    return platform_driver_register(&led_driver);
}

static void __exit led_driver_exit(void)
{
    printk("led driver exit \r\n");
    platform_driver_unregister(&led_driver);
}

module_init(led_driver_init);
module_exit(led_driver_exit);
MODULE_LICENSE("GPL");

```

我们在根节点下创建一个misc设备

```C
	miscled {
		compatible = "alientek,miscled";
		miscled-gpio =  <&gpio0 RK_PC0 GPIO_ACTIVE_HIGH>;
		status = "okay";
	};
```

编译系统，烧录boot.img,  重新烧录到对应的分区

## 现象

将编译后的模块插件使用adb方式push到板卡对应目录，并加载

```
root@ATK-DLRK3568:/# clear
root@ATK-DLRK3568:/# cd /lib/modules
root@ATK-DLRK3568:/lib/modules# ls
5.10.160              led_device.ko            parameter.ko
8852be.ko             led_driver.ko            rtk_btusb.ko
8852bs.ko             led_driver_module.ko     rtkm.ko
bcmdhd.ko             led_dts_gpio_module.ko   RTL8189FS.ko
bcmdhd_pcie.ko        led_dts_module.ko        RTL8189FU.ko
calculate.ko          led_dts_timer_module.ko  RTL8723DS.ko
chardev_module.ko     led_misc_driver.ko       RTL8821CS.ko
hci_uart.ko           led_mutex_module.ko      RTL8822CS.ko
hello.ko              led_semaphore_module.ko
led_atomic_module.ko  led_spin_lock_module.ko
root@ATK-DLRK3568:/lib/modules# insmod led_misc_driver.ko
[   35.718312] led driver and device matched
root@ATK-DLRK3568:/lib/modules# cd /home/ftp/
root@ATK-DLRK3568:/home/ftp# ls
chardev_app       led_platform_test_app  led_timer_test_app  semaphore_test_app
led_dts_test_app  led_test_app           mutex_test_app      spin_lock_test_app
root@ATK-DLRK3568:/home/ftp# ls /dev/dtsmiscled
/dev/dtsmiscled
root@ATK-DLRK3568:/home/ftp# ./led_platform_test_app /dev/dtsmiscled
[   55.669871] led fp open
LED test started on /dev/dtsmiscled (Ctrl+C to stop)
```

还是使用上一节的测试APP，实现LED一秒钟周期闪烁的效果

## 总结

对于是否使用MISC字符设备，先找功能子系统，找不到再用 MISC；如果需要大量次设备号，或者需要更多控制，就用普通字符设备。
