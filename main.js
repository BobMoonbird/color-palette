miro.onReady(() => {
    const icon24 = '<g id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve"><circle fill-opacity="0" stroke="#231F20" stroke-width="2" stroke-miterlimit="10" cx="8.7" cy="8.7" r="2.6"/><path fill-opacity="0" stroke="#231F20" stroke-width="2" stroke-miterlimit="10" d="M21.3,7.4c0-0.8-0.2-1.5-0.6-2.3 c-0.9-1.6-2.5-2.5-4.2-2.5l0,0c-3.5,0-3.5,0-7.8,0c-3.3,0-6.1,2.7-6.1,6.1c0,1,0.3,2,0.7,2.8l0,0c0.4,0.8,0.4,1.8,0,2.6l0,0 c-0.8,1.4-0.9,3.2-0.1,4.7c0.9,1.6,2.5,2.5,4.2,2.5l0,0l0,0c4.6,0,4.6,0,9.1,0l0,0c0.8,0,1.5-0.2,2.3-0.6c1.6-0.9,2.5-2.5,2.5-4.2 l0,0C21.3,12,21.3,12,21.3,7.4L21.3,7.4z"/><circle fill="#231F20" cx="8.8" cy="17.6" r="1.8"/><circle fill="#231F20" cx="14.2" cy="16.6" r="1.8"/><circle fill="#231F20" cx="17.1" cy="12.5" r="1.8"/><circle fill="#231F20" cx="16.5" cy="7.1" r="1.8"/></g>'

    miro.initialize({
        extensionPoints: {
            bottomBar: {
                title: 'color palette',
                svgIcon: icon24,
                onClick: async() => {
                    const authorized = await miro.isAuthorized()
                    if (authorized) {
                        miro.board.ui.openLeftSidebar('screen.html')
                    } else {
                        miro.board.ui.openModal('not-authorized.html')
                            .then(res => {
                                if (res === 'success') {
                                    miro.board.ui.openLeftSidebar('screen.html')
                                }
                            })
                    }
                }
            },
        }
    })
})