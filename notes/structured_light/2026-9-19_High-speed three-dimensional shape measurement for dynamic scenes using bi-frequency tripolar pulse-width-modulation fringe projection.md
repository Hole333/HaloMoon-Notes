---
title: 'High-speed three-dimensional shape measurement for dynamic scenes using bi-frequency tripolar pulse-width-modulation fringe projection'
description: '论文信息'
created: '2026-09-19'
updated: '2026-09-19'
tags: ['structured_light']
draft: false
---
## 论文信息

* 期刊: ScienceDirect
* 学校: 南京理工大学
* 团队: 左超团队
* 出版时间: 2013年8月
* 论文下载链接: [链接](https://pdf.sciencedirectassets.com/271471/1-s2.0-S0143816613X00065/1-s2.0-S0143816613000754/main.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEIr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIEk2g51a5aj4us%2BuxHgCSpNwtjLF4dKn0KrcQIcKNXTkAiA7eMDwS6IaoKo3%2FVS%2FdTWRa9mdH0bXCDYTBfd21j4lRyqzBQhTEAUaDDA1OTAwMzU0Njg2NSIMjNdM%2FnV2wxffyr30KpAFB6ny36Kt%2Be7WvyhPge2tanmt94DscFLjh%2FWVo%2BtwP5L6PDMwUzto6FJ2DV1G4QNHAfxGW9W%2Fmda9%2FaE%2Fq3Ozl2fukAI6UIshDBu7zY8ruePTcY9Ha2XRpS1llSNt%2BcnjZhad6zOfWhBtMRArRv3ND7mgsmVsbz%2Bs8nlpo6eUsQMiuh05ZMDQSCmhC%2BzzTLb5I7mMvtnTfw9%2FiATAlwL5vGeRUii0xW0xjmZC93Mvyj4HPPiuYgQOdCh%2BHkU3pgz9zV0Q4gQL6eo5aArtO3W4SIYgK8cz7uu53tyeVrneryNt8evQI7lHNmPzbIVsAC3jl2yzEvG%2Fqpm5fVPWAknBvTj%2BOFIEaod7Wpn1tp3f%2Bi48Rnriy1%2B0ShLWxXUQzf%2BShMMPvny7S05muhgTudGWcuM9bnRzNW7huSdylqFX03QyB6RLdIunmxbZQ38jkng43EgPdqa3QBcqoKKmuqBk%2F4Q0lqGLxRHZRwbBWift3S7pP30MBxuT2x5FwcOhSJbURBsoXMC7ykndA424U3bO1bOLlsxIRGl%2BLw5CHiDv1z2FMqiDu4BWNHXLntMu7O4djUgUcseVzb%2FHDjC5jtmBLSl4GO0qI0Ie%2FvCVFM8egWEaoUh0Y2zk78slTNPNU%2FufEWgnwqb8raIeoKvNuoKjXthrPXEZ5RdFmNbuidZ%2FEs%2BxvTHW3wJTaKH8IqV9rlA8XulRs302Qk4APKDgDTsJWhAhOZGVKxDCplhcQNquaLWP5RksmbMmsssxy7VhYrQZogwfqGdUdo3B%2FXzX%2BNdEeOB2zw1ISYQvHWtYE1v9BvWU64dEQIvi7vpFGPLiY3swSJWW5aE%2FN%2BjSpGzQ1xLI26b1tCcX%2FqvplZ%2B7cBxtc4IwrtO31QY6sgH9zfwZcuylNcb5zTfmzjTyEzoPG8%2BqCjwdjyGLacgA499v%2FWGIHoMuBtekNb%2FeWe0B8HNQqU7pf3bIG0ZBYJPCwDl7uWZ6nYPYP9Sh89irFHIl2k85DY8mmP0NvUIISePfO1gUdbzKQn973XwJZF5vQEHjF11cG43tJ5Y2xLzbgH9oROeS5AvdwhPXcnNO7l4ABSo%2B1Pksde25enVu%2B8HGaLe1IxQNN4ONjaB6j00YNrN9&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260919T020635Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAQ3PHCVTY67WTYHE2%2F20260919%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=c3abe093984788142dbd5957bf7a9a9d7fd0ccba3c17734c8ceaa45fcd9a1c99&hash=bd3814b1605e2a8c89d2b53ac0279b9fd882a3db6b47c0c4e431a7aab5ba64cf&host=68042c943591013ac2b2430a89b270f6af2c76d8dfd086a07176afe7c76c2c61&pii=S0143816613000754&tid=spdf-e4736134-1540-46d4-8df5-ee8d886dd2b6&sid=85c952a48b11d1464d0a6c4-97d431cbfbc3gxrqa&type=client&tsoh=d3d3LnNjaWVuY2VkaXJlY3QuY29t&rh=d3d3LnNjaWVuY2VkaXJlY3QuY29t&ua=0f1205510752575a54&rr=a3d50831682ceacd&cc=jp)

## 引言

动态结构光三维重建中，多帧相移和 Gray Code 会增加采集时间，容易产生运动误差。该论文采用双频相移，仅用 5 幅条纹获得两组包裹相位，并通过数论 LUT 恢复绝对相位；同时利用 TPWM 提高 DLP 投影速度和条纹正弦性，从而实现高速动态场景三维测量。

## 方法介绍

针对于动态结构光的三维重建，首先论文使用双频移相法用5副条纹算出两副不同频率的包裹相位**ϕ**1 和 ϕ2  

前三幅条纹表示为：

$$
I_1(x,y)
=
A(x,y)
+
B(x,y)
\cos
\left(
\phi_1(x,y)-\frac{2\pi}{3}
\right)
$$

$$
I_2(x,y)
=
A(x,y)
+
B(x,y)\cos[\phi_1(x,y)]
$$

$$
I_3(x,y)
=
A(x,y)
+
B(x,y)
\cos
\left(
\phi_1(x,y)+\frac{2\pi}{3}
\right)
$$

其中：

- $A(x,y)$：平均光强，与背景光和物体表面亮度有关
- $B(x,y)$：条纹调制度，与条纹对比度和物体反射率有关
- $\phi_1(x,y)$：第一组条纹对应的包裹相位

由三步相移公式可以得到：

$$

\phi_1(x,y)
=
\tan^{-1}
\left(
\frac{
\sqrt{3}\left(I_1(x,y)-I_3(x,y)\right)
}{
2I_2(x,y)-I_1(x,y)-I_3(x,y)
}
\right)

$$

前三幅条纹的相移刚好相差 $120^\circ$，三个余弦项相加后可以相互抵消：

$$
\cos
\left(
\phi_1-\frac{2\pi}{3}
\right)
+
\cos(\phi_1)
+
\cos
\left(
\phi_1+\frac{2\pi}{3}
\right)
=
0
$$

因此：

$$
I_1+I_2+I_3
=
3A
$$

得到：

$$

A(x,y)
=
\frac{
I_1(x,y)+I_2(x,y)+I_3(x,y)
}{3}

$$

这样就不需要为第二种频率再额外投一整组三步相移图。

再投射另外两幅条纹：

$$
I_4(x,y)
=
A(x,y)
+
B(x,y)\sin[\phi_2(x,y)]
$$

$$
I_5(x,y)
=
A(x,y)
+
B(x,y)\cos[\phi_2(x,y)]
$$

这里的 $\phi_2$ 对应另一种空间频率。

求第二幅包裹相位 $\phi_2$

由：

$$
I_4-A=B\sin\phi_2
$$

$$
I_5-A=B\cos\phi_2
$$

两式相除：

$$
\frac{I_4-A}{I_5-A}
=
\tan\phi_2
$$

因此：

$$

\phi_2(x,y)
=
\tan^{-1}
\left(
\frac{
I_4(x,y)-A(x,y)
}{
I_5(x,y)-A(x,y)
}
\right)

$$

于是，只用 5 幅条纹就得到了两幅不同频率的包裹相位：

论文中提到了三种方法将不同频率的相位转化为绝对相位低频层级法、相位差法、数论法

### 低频层级法

针对于这个方法，实际上是为了更高效率的编码基础上，解决包裹相位转化为绝对相位的周期性 2π 歧义问题，而导致相位偏移的问题。其本质是通过投射低频的不到一个周期的正弦条纹，按照比例关系将高频的正弦条纹计算的包裹相位转化为绝对相位

由于两组不同周期的正弦条纹

$$
F_1(x,y)=\phi_1(x,y)+2\pi k_1(x,y)
$$

$$
F_2(x,y)=\phi_2(x,y)+2\pi k_2(x,y)
$$



其中：

- $\phi_1,\phi_2$：计算得到的包裹相位
- $F_1,F_2$：展开后的绝对相位
- $k_1,k_2$：条纹周期级次

因为两组条纹测量的是同一个位置，只是条纹周期不同，所以有：

$$

F_1(x,y)=\frac{\lambda_2}{\lambda_1}F_2(x,y)
$$

其中

* $\lambda_1,\lambda_2$：两组条纹的周期

将第二组条纹设计得非常低频，也就是让：

$$
\lambda_2 \gg \lambda_1
$$

使低频条纹在整个测量视场内的相位变化不到一个完整周期：

$$
\Delta F_2<2\pi
$$

这样低频相位不会出现 $2\pi$ 周期跳变，因此不需要进行相位展开：

$$

F_2(x,y)=\phi_2(x,y)
$$

最后利用比例关系使用得到的低频相位转化为高频绝对相位

$$
F_2=\phi_2
$$

代入：

$$
F_1=\frac{\lambda_2}{\lambda_1}F_2
$$

得到：

$$

F_1=
\frac{\lambda_2}{\lambda_1}\phi_2

$$

也就是说，通过没有歧义的低频相位，可以知道高频绝对相位理论上应该处于什么位置, 也就是粗略的计算出F1的绝对相位位置。

高频绝对相位本身满足：

$$
F_1=\phi_1+2\pi k_1
$$

而前面又得到：

$$
F_1=
\frac{\lambda_2}{\lambda_1}\phi_2
$$

所以：

$$
\phi_1+2\pi k_1
=
\frac{\lambda_2}{\lambda_1}\phi_2
$$

移项：

$$
2\pi k_1
=
\frac{\lambda_2}{\lambda_1}\phi_2-\phi_1
$$

两边同时除以 $2\pi$：

$$

k_1=
\frac{
\frac{\lambda_2}{\lambda_1}\phi_2-\phi_1
}{
2\pi
}

$$

由于 $k_1$ 表示条纹周期数，因此必须是整数。

实际测量存在噪声时，可以取最近的整数：

$$

k_1=
\operatorname{round}
\left(
\frac{
\frac{\lambda_2}{\lambda_1}\phi_2-\phi_1
}{
2\pi
}
\right)

$$

得到 $k_1$ 后，再代回：

$$

F_1=\phi_1+2\pi k_1

$$

这样就完成了高频包裹相位到绝对相位的展开。

### 相位差法

双频相移以后，可以得到两幅不同周期的包裹相位：

$$
\phi_1(x,y) , \phi_2(x,y)
$$

对应的条纹周期分别为：

$$
\lambda_1 , \lambda_2
$$

对应的绝对相位为：

$$
F_1(x,y)
=
\phi_1(x,y)
+
2\pi k_1(x,y)
$$

$$
F_2(x,y)
=
\phi_2(x,y)
+
2\pi k_2(x,y)
$$

其中：

- $\phi_1,\phi_2$：包裹相位
- $F_1,F_2$：绝对相位
- $k_1,k_2$：条纹周期级次
- $\lambda_1,\lambda_2$：两组条纹周期

对于同一个空间位置 $u$，两种不同周期条纹的绝对相位可以写成：

$$
F_1
=
\frac{2\pi u}{\lambda_1}
$$

$$
F_2
=
\frac{2\pi u}{\lambda_2}
$$

两者相减：

$$
F_1-F_2
=
\frac{2\pi u}{\lambda_1}
-
\frac{2\pi u}{\lambda_2}
$$

提取 $2\pi u$：

$$
F_1-F_2
=
2\pi u
\left(
\frac{1}{\lambda_1}
-
\frac{1}{\lambda_2}
\right)
$$

通分：

$$
F_1-F_2
=
2\pi u
\frac{
\lambda_2-\lambda_1
}{
\lambda_1\lambda_2
}
$$

定义一个新的等效周期：

$$

\lambda_{12}
=
\frac{
\lambda_1\lambda_2
}{
\lambda_2-\lambda_1
}

$$

于是：

$$

F_1-F_2
=
\frac{2\pi u}{\lambda_{12}}

$$

因此，两幅高频相位做差以后，相当于产生了一幅周期为：

$$
\lambda_{12}
$$

的新低频条纹。

这个 $\lambda_{12}$ 就叫：

> **合成波长（Synthetic Wavelength）**
>

实际测量得到的并不是 $F_1,F_2$，而是：

$$
\phi_1,\phi_2
$$

因此论文对两幅包裹相位做差：

$$

\Delta\phi_{12}
=
(\phi_1-\phi_2)
\bmod 2\pi

$$

这里的 `mod 2π` 是为了把相位差重新限制在一个相位周期内。

所以：

$$
\Delta\phi_{12}
$$

可以看成一幅新的“虚拟低频包裹相位”。

其等效周期就是：

$$

\lambda_{12}
=
\frac{
\lambda_1\lambda_2
}{
\lambda_2-\lambda_1
}

$$

利用虚拟低频相位恢复 $F_1$

前面有：

$$
F_1
=
\frac{2\pi u}{\lambda_1}
$$

而：

$$
F_{12}
=
\frac{2\pi u}{\lambda_{12}}
$$

两式相除：

$$
\frac{F_1}{F_{12}}
=
\frac{\lambda_{12}}{\lambda_1}
$$

因此：

$$

F_1
=
\frac{\lambda_{12}}{\lambda_1}
F_{12}

$$

因为：

$$
F_{12}
=
\Delta\phi_{12}
$$

所以：

$$

F_1^{coarse}
=
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}

$$

这里得到的是由虚拟低频相位推算出来的高频绝对相位。

求第一组条纹的周期级次 $k_1$

高频绝对相位本身满足：

$$
F_1
=
\phi_1+2\pi k_1
$$

而前面得到：

$$
F_1^{coarse}
=
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}
$$

因此：

$$
\phi_1+2\pi k_1
=
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}
$$

移项：

$$
2\pi k_1
=
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}
-
\phi_1
$$

因此：

$$

k_1
=
\frac{
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}
-
\phi_1
}{
2\pi
}

$$

实际存在噪声时，可以取最近整数：

$$

k_1
=
\operatorname{round}
\left(
\frac{
\frac{\lambda_{12}}{\lambda_1}
\Delta\phi_{12}
-
\phi_1
}{
2\pi
}
\right)

$$

最后：

$$

F_1
=
\phi_1+2\pi k_1

$$

### 数论法

前面已经得到两组不同周期的包裹相位：

$$
\phi_1,\phi_2
$$

数论法的核心是利用两种条纹周期的组合唯一性，直接确定对应的周期级次：

$$
(k_1,k_2)
$$

两种条纹联合重复的周期为（也就是求最小公倍数比如3和5，最小公倍数就是15， 也就是L = 15）：

$$

L=LCM(\lambda_1,\lambda_2)

$$

并定义：

$$
p_1=\frac{L}{\lambda_1}
$$

$$
p_2=\frac{L}{\lambda_2}
$$

其中 $p_1,p_2$ 表示在一个无歧义范围 $L$ 内，两种条纹分别包含多少个周期。

由于两组条纹对应同一个位置：

$$
F_1=\frac{\lambda_2}{\lambda_1}F_2
$$

利用 $p_1,p_2$ 可以改写为：

$$

p_2F_1=p_1F_2

$$

代入：

$$
F_1=\phi_1+2\pi k_1
$$

$$
F_2=\phi_2+2\pi k_2
$$

得到：

$$
p_2(\phi_1+2\pi k_1)
=
p_1(\phi_2+2\pi k_2)
$$

整理：

$$
p_2\phi_1-p_1\phi_2
=
2\pi(p_1k_2-p_2k_1)
$$

因此：

$$

\frac{
p_2\phi_1-p_1\phi_2
}{
2\pi
}
=
p_1k_2-p_2k_1

$$

构建 LUT

右侧：

$$
p_1k_2-p_2k_1
$$

一定是整数，因此定义：

$$

q=
\operatorname{round}
\left(
\frac{
p_2\phi_1-p_1\phi_2
}{
2\pi
}
\right)

$$

在一个 $LCM$ 无歧义范围内，不同的合法：

$$
(k_1,k_2)
$$

对应不同的 $q$。

因此可以提前建立：

$$

q\longleftrightarrow(k_1,k_2)

$$

的 LUT。

实际测量时：

$$
(\phi_1,\phi_2)
\rightarrow
q
\rightarrow
LUT
\rightarrow
(k_1,k_2)
$$

对应于论文可以得到以下LUT对应图

![1789798484529](image/2026-9-19_High-speedthree-dimensionalshapemeasurementfordynamicscenesusingbi-frequencytripolarpulse-width-modulationfringeprojection/1789798484529.png)

以及对应的采集表格

![1789798541968](image/2026-9-19_High-speedthree-dimensionalshapemeasurementfordynamicscenesusingbi-frequencytripolarpulse-width-modulationfringeprojection/1789798541968.png)

最后可以根据表格查找然后恢复绝对相位

查表得到 $k_1,k_2$ 后：

$$

F_1=\phi_1+2\pi k_1

$$

$$

F_2=\phi_2+2\pi k_2

$$

### TPWM调制优化

TPWM 的主要目的，是在 **提高 DLP 投影速度的同时，尽量保证投影条纹接近理想正弦波**。DMD 本质上是二值器件，每个微镜在一个时刻只能处于 0 或者 1。如果直接生成多灰度正弦条纹，需要多个 DMD 开关周期去合成灰度，投影速度会下降。因此希望尽量减少灰度级，提高投影速度。但灰度级减少以后，条纹会越来越不像理想正弦波，并引入高次谐波，从而产生相位误差。

因此 TPWM 使用三电平：

$$

0,\quad0.5,\quad1

$$

来近似生成正弦条纹。

它利用两组三角载波与目标正弦波进行比较，两组三角载波之间相差 π，最终生成三电平 TPWM 波形。

论文中指出，TPWM 的主要高频频谱集中在：

$$

2f_c

$$

附近。

其中：

- $f_0$：目标正弦条纹的基频
- $f_c$：三角载波频率

因为这些高次谐波距离基频 $f_0$ 很远，所以即使投影仪只进行轻微离焦，也可以把这些高频成分滤掉。

最终保留下来的主要就是：

$$
f_0
$$

因此得到接近理想的正弦条纹。

![1789798908654](image/2026-9-19_High-speedthree-dimensionalshapemeasurementfordynamicscenesusingbi-frequencytripolarpulse-width-modulationfringeprojection/1789798908654.png)

### 非线性相位--高度建模与标定

得到绝对相位后，首先计算物体相对于参考平面的绝对相位差：


$$

\Delta F(x,y)
=
F_{\text{object}}(x,y)
-
F_{\text{reference}}(x,y)

$$

论文采用非线性相位—高度模型：

$$

\frac{1}{z(x,y)}
=
a(x,y)
+
\frac{b(x,y)}{\Delta F(x,y)}
+
\frac{c(x,y)}{\Delta F^2(x,y)}

$$

其中：

- $z(x,y)$：物体实际高度
- $\Delta F(x,y)$：相对于参考平面的绝对相位差
- $a(x,y),b(x,y),c(x,y)$：每个相机像素对应的标定参数

而实际的标定过程可以参考  利用散斑嵌入条纹和查找表进行三维面形测量 文章的标定过程， 这个方法也应证了我在该文章的建模可行性

## 实验结果

* 实验采用两组条纹周期  **48 pixel 和 28 pixel** ，对应无歧义范围约  **336 pixel** ；DLP 二值图以 **2500 fps** 投影，相机以 **1250 fps** 采集，并利用 5 帧滑动窗口，使三维数据更新速率达到  **1250 fps** 。
* 第一组实验是 **摆动的纸巾 + 静止石膏像** 。两组包裹相位经数论法展开后，k1,k2k_1,k_2 能被正确判断，LUT 加权索引与理想整数之间的误差没有超过 0.5，因此没有发生条纹级次误判；最终能够同时恢复运动物体和独立静止物体的三维形貌及纹理。
* 第二组实验是约  **300 RPM 的旋转风扇** 。整体三维形状可以恢复出来，但由于扇叶运动速度已经接近一次测量所需时间， **扇叶边缘出现了一些异常点** ，论文通过额外的离群点去除算法处理。
* 最终论文结论是：该方法能够对具有**运动、表面不连续、较大深度变化以及多个独立目标**的场景进行高速全场三维测量，实验达到 **1250 fps**

![1789799837720](image/2026-9-19_High-speedthree-dimensionalshapemeasurementfordynamicscenesusingbi-frequencytripolarpulse-width-modulationfringeprojection/1789799837720.png)

![1789799851623](image/2026-9-19_High-speedthree-dimensionalshapemeasurementfordynamicscenesusingbi-frequencytripolarpulse-width-modulationfringeprojection/1789799851623.png)

## 总结

这篇论文从两个角度优化了传统结构光三维成像建模的缺点，第一个角度，创新性的引入数论方法结合双频移相法使用LUT的方式查表建模相位与 k1 k2编码位置关系，并优化投影仪DMD的PWM图像调制方式，使用三电平的TPWM方式提高投影帧率，保证投影的正弦条纹不失真。

## 可能的额外创新点

有没有可能可以进一步把投放的图像压缩成一张，也就是不单纯为正弦条纹，而是多个频率混叠的，也就是一帧图像双频率复合，使用傅里叶变换求解

todo.....
