using Helpers as helpers;
using ERC20_A as erc20A;
using ERC20_B as erc20B;
using DexMock as dex;
using SmartVault as smartVault;
using WrappedNativeTokenMock as wrappedNativeToken;

// METHODS

methods {
    // Dispatch ERC20 functions
    function _.balanceOf(address) external                      => DISPATCHER(true);
    function _.allowance(address,address) external              => DISPATCHER(true);
    function _.approve(address,uint256) external                => DISPATCHER(true);
    function _.transfer(address,uint256) external               => DISPATCHER(true);
    function _.transferFrom(address,address,uint256) external   => DISPATCHER(true);

    // Dispatch SmartVault functions
    function _.wrappedNativeToken() external                    => DISPATCHER(true);
    function _.collect(address,address,uint256) external        => DISPATCHER(true);
    function _.wrap(uint256) external                           => DISPATCHER(true);
    function _.unwrap(uint256) external                         => DISPATCHER(true);
    function _.execute(address) external                        => DISPATCHER(true);
    function _.withdraw(address,address,uint256) external       => DISPATCHER(true);

    // Helpers
    function helpers.getTokenBalanceOf(address, address) external returns (uint256) envfree;
    function helpers.getNativeTokenBalanceOf(address) external returns (uint256) envfree;
    function helpers.castUint32ToBytes4(uint32) external returns (bytes4) envfree;

    // Swapper
    function isPaused() external returns (bool) envfree;
    function connector() external returns (address) envfree;
    function smartVault() external returns (address) envfree;
}

function requireValidSender(env e) {
    require e.msg.sender != wrappedNativeToken;
}

// RULES

rule canBeCalledWhenNotPaused(env e, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes data)
    good_description "Swapper task can only be called when not paused"
{
    bool paused = isPaused();

    call(e, tokenIn, amountIn, tokenOut, minAmountOut, data);

    assert !paused;
}

rule
    senderGetsDeductedAtMostTheAmountIn(env e, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes data)
    good_description "Sender will get deducted at most the amount in"
{
    requireValidSender(e);
    require e.msg.sender != dex;
    require e.msg.sender != smartVault;

    uint256 tokenBalanceBefore = helpers.getTokenBalanceOf(tokenIn, e.msg.sender);
    uint256 nativeTokenBalanceBefore = helpers.getNativeTokenBalanceOf(e.msg.sender);

    call(e, tokenIn, amountIn, tokenOut, minAmountOut, data);

    uint256 tokenBalanceAfter = helpers.getTokenBalanceOf(tokenIn, e.msg.sender);
    uint256 nativeTokenBalanceAfter = helpers.getNativeTokenBalanceOf(e.msg.sender);

    assert tokenBalanceBefore == tokenBalanceAfter => to_mathint(nativeTokenBalanceAfter) == nativeTokenBalanceBefore - amountIn;
    assert nativeTokenBalanceBefore == nativeTokenBalanceAfter => to_mathint(tokenBalanceAfter) == tokenBalanceBefore - amountIn;
}

rule
    senderReceivesAtLeastTheMinAmountOut(env e, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes data)
    good_description "Sender will receive at least the min amount out"
{
    requireValidSender(e);
    require e.msg.sender != dex;

    uint256 tokenBalanceBefore = helpers.getTokenBalanceOf(tokenOut, e.msg.sender);
    uint256 nativeTokenBalanceBefore = helpers.getNativeTokenBalanceOf(e.msg.sender);

    call(e, tokenIn, amountIn, tokenOut, minAmountOut, data);

    uint256 tokenBalanceAfter = helpers.getTokenBalanceOf(tokenOut, e.msg.sender);
    uint256 nativeTokenBalanceAfter = helpers.getNativeTokenBalanceOf(e.msg.sender);

    assert tokenBalanceBefore == tokenBalanceAfter => to_mathint(nativeTokenBalanceAfter) >= nativeTokenBalanceBefore + minAmountOut;
    assert nativeTokenBalanceBefore == nativeTokenBalanceAfter => to_mathint(tokenBalanceAfter) >= tokenBalanceBefore + minAmountOut;
}

rule
    zeroSumSwapperInvariant(env e, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes data)
    good_description "Swapper task must not hold any funds"
{
    requireValidSender(e);
    require e.msg.sender != currentContract;

    uint256 tokenInBalanceBefore = helpers.getTokenBalanceOf(tokenIn, currentContract);
    uint256 tokenOutBalanceBefore = helpers.getTokenBalanceOf(tokenOut, currentContract);
    uint256 nativeTokenBalanceBefore = helpers.getNativeTokenBalanceOf(currentContract);

    call(e, tokenIn, amountIn, tokenOut, minAmountOut, data);

    uint256 tokenInBalanceAfter = helpers.getTokenBalanceOf(tokenIn, currentContract);
    assert tokenInBalanceBefore == tokenInBalanceAfter;

    uint256 tokenOutBalanceAfter = helpers.getTokenBalanceOf(tokenOut, currentContract);
    assert tokenOutBalanceBefore == tokenOutBalanceAfter;

    uint256 nativeTokenBalanceAfter = helpers.getNativeTokenBalanceOf(currentContract);
    assert nativeTokenBalanceBefore == nativeTokenBalanceAfter;
}
