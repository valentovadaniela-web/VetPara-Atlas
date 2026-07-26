/******************************************************************************
 * VetPara Atlas
 * File: Navbar.js
 ******************************************************************************/

export default class Navbar {

    render() {

        return `
<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">

<div class="container">

<a class="navbar-brand fw-bold" href="#home">

VetPara Atlas

</a>

<ul class="navbar-nav ms-auto">

<li class="nav-item">

<a class="nav-link" href="#home">

Domov

</a>

</li>

<li class="nav-item">

<a class="nav-link" href="#atlas">

Atlas

</a>

</li>

<li class="nav-item">

<a class="nav-link" href="#gallery">

Galéria

</a>

</li>

<li class="nav-item">

<a class="nav-link" href="#expert">

Expert

</a>

</li>

</ul>

</div>

</nav>
`;

    }

}
