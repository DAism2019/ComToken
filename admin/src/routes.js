/* !

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. */
// @material-ui/icons

import LibraryBooks from "@material-ui/icons/LibraryBooks";
// import Payment from "@material-ui/icons/Payment";
// import CreateToken from "views/CreateToken/CreateToken.jsx";
import AllTokens from "views/AllTokens/AllTokens.jsx";


const dashboardRoutes = [{
        path: "all",
        name: "all_token",
        icon: LibraryBooks,
        component: AllTokens,
        layout: "/"
    }
    // {
    //     path: "new",
    //     name: "new_token",
    //     icon: Payment,
    //     component: CreateToken,
    //     layout: "/"
    // }
];

export default dashboardRoutes;